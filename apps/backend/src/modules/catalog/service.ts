/**
 * The retailer-facing catalog.
 *
 * Visibility is the whole job here. A product is browsable only when it is
 * active AND its brand has been approved — otherwise a brand could sit in the
 * approval queue while its goods were already for sale, which defeats the
 * document check.
 */
import type { Category, Prisma } from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../middleware/error.ts'
import {
  storeRatingsForBrands,
  summariesForProducts,
} from '../reviews/service.ts'

/** A product nobody has rated yet. Null average, not zero — see domain/rating. */
const EMPTY_RATING = { average: null, count: 0 } as const

/** The single definition of "a retailer may see this". */
const VISIBLE = {
  isActive: true,
  brand: { user: { status: 'ONBOARDED' } },
} satisfies Prisma.ProductWhereInput

const catalogSelect = {
  id: true,
  name: true,
  description: true,
  photoUrl: true,
  pricePerPackMinor: true,
  minPacks: true,
  unitsPerPack: true,
  category: true,
  stockPacks: true,
  createdAt: true,
  brand: { select: { id: true, name: true, logoUrl: true, province: true } },
} satisfies Prisma.ProductSelect

/**
 * The spec, on the detail screen only.
 *
 * Kept out of `catalogSelect` on purpose: browse returns 24 rows a page and
 * `ingredients` alone is up to 2 KB, so folding these into the list would cost
 * ~50 KB a scroll for fields no product card renders.
 */
const catalogDetailSelect = {
  ...catalogSelect,
  sku: true,
  barcode: true,
  packWeightGrams: true,
  ingredients: true,
  shelfLifeDays: true,
} satisfies Prisma.ProductSelect

export interface BrowseFilter {
  category?: Category
  brandId?: string
  q?: string
  cursor?: string
  limit: number
}

/**
 * Cursor pagination, not offset.
 *
 * Brands add and retire products while a retailer is scrolling; with OFFSET,
 * a row inserted before the cursor shifts everything and the reader silently
 * skips an item. A keyset cursor on a stable id cannot do that.
 */
export async function browse(filter: BrowseFilter) {
  const { category, brandId, q, cursor, limit } = filter

  const items = await prisma.product.findMany({
    where: {
      ...VISIBLE,
      category,
      brandId,
      // Case-insensitive substring on name. Good enough at MVP scale; if the
      // catalog grows this wants a Postgres full-text index instead.
      name: q ? { contains: q, mode: 'insensitive' } : undefined,
    },
    select: catalogSelect,
    orderBy: { createdAt: 'desc' },
    // Fetch one extra to discover whether another page exists, without a
    // second count query.
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items

  // One groupBy for the whole page. Every card shows stars, so fetching them
  // per product would be an N+1 on the busiest screen in the app.
  const ratings = await summariesForProducts(page.map((p) => p.id))

  return {
    items: page.map((product) => ({
      ...product,
      rating: ratings.get(product.id) ?? EMPTY_RATING,
    })),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  }
}

export async function getVisible(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, ...VISIBLE },
    select: catalogDetailSelect,
  })

  if (!product) {
    // Same 404 whether the product is missing, inactive, or belongs to an
    // unapproved brand — a retailer has no business distinguishing those.
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No such product.')
  }

  const ratings = await summariesForProducts([product.id])

  return { ...product, rating: ratings.get(product.id) ?? EMPTY_RATING }
}

/** Brands with at least one visible product — for a filter dropdown. */
export async function listBrands() {
  const brands = await prisma.brandProfile.findMany({
    where: {
      user: { status: 'ONBOARDED' },
      products: { some: { isActive: true } },
    },
    select: { id: true, name: true, logoUrl: true, province: true },
    orderBy: { name: 'asc' },
  })

  // One groupBy across every brand rather than a query each: the filter
  // dropdown loads the whole list at once.
  const ratings = await storeRatingsForBrands(brands.map((b) => b.id))

  return brands.map((brand) => ({
    ...brand,
    rating: ratings.get(brand.id) ?? EMPTY_RATING,
  }))
}
