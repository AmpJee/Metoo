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

/** The single definition of "a retailer may see this". */
const VISIBLE = {
  isActive: true,
  brand: { user: { status: 'APPROVED' } },
} satisfies Prisma.ProductWhereInput

const catalogSelect = {
  id: true,
  name: true,
  description: true,
  photoUrl: true,
  unitPriceMinor: true,
  moq: true,
  caseSize: true,
  category: true,
  stockQty: true,
  createdAt: true,
  brand: { select: { id: true, name: true, logoUrl: true, province: true } },
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

  return {
    items: page,
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  }
}

export async function getVisible(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, ...VISIBLE },
    select: catalogSelect,
  })

  if (!product) {
    // Same 404 whether the product is missing, inactive, or belongs to an
    // unapproved brand — a retailer has no business distinguishing those.
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No such product.')
  }

  return product
}

/** Brands with at least one visible product — for a filter dropdown. */
export function listBrands() {
  return prisma.brandProfile.findMany({
    where: {
      user: { status: 'APPROVED' },
      products: { some: { isActive: true } },
    },
    select: { id: true, name: true, logoUrl: true, province: true },
    orderBy: { name: 'asc' },
  })
}
