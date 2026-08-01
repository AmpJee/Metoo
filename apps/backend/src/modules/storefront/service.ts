/**
 * Brand storefronts and follows.
 *
 * The storefront is the "Preview Store" page in the design: brand identity,
 * store rating, follower count, product count, and the active products
 * themselves. A brand sees its own via the same route, which is what makes the
 * preview honest — it is literally the buyer's view.
 *
 * Only ONBOARDED brands have a storefront. A brand still in the pipeline has
 * no public page, for the same reason its products are not browsable.
 */
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../middleware/error.ts'
import { storeRating, summariesForProducts } from '../reviews/service.ts'

const EMPTY_RATING = { average: null, count: 0 } as const

/** A brand a buyer is allowed to see. */
const VISIBLE_BRAND = { user: { status: 'ONBOARDED' } } as const

export async function follow(retailerId: string, brandId: string) {
  const brand = await prisma.brandProfile.findFirst({
    where: { id: brandId, ...VISIBLE_BRAND },
    select: { id: true },
  })

  if (!brand) {
    throw new AppError(404, 'BRAND_NOT_FOUND', 'No such brand.')
  }

  // upsert, not create: following twice should succeed quietly rather than
  // 409 on the unique index, and must not inflate the count.
  await prisma.brandFollow.upsert({
    where: { retailerId_brandId: { retailerId, brandId } },
    update: {},
    create: { retailerId, brandId },
  })

  return { following: true, followerCount: await followerCount(brandId) }
}

export async function unfollow(retailerId: string, brandId: string) {
  // deleteMany: unfollowing something not followed is a no-op, which is what
  // an idempotent toggle needs.
  await prisma.brandFollow.deleteMany({ where: { retailerId, brandId } })
  return { following: false, followerCount: await followerCount(brandId) }
}

function followerCount(brandId: string) {
  return prisma.brandFollow.count({ where: { brandId } })
}

/** Brands this retailer follows, for their own list. */
export async function listFollowed(retailerId: string) {
  const rows = await prisma.brandFollow.findMany({
    where: { retailerId, brand: VISIBLE_BRAND },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      brand: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          province: true,
          _count: { select: { followers: true } },
        },
      },
    },
  })

  return rows.map((row) => ({
    followedAt: row.createdAt,
    id: row.brand.id,
    name: row.brand.name,
    logoUrl: row.brand.logoUrl,
    province: row.brand.province,
    followerCount: row.brand._count.followers,
  }))
}

/**
 * A brand's public storefront.
 *
 * `viewerRetailerId` is optional so the page can render for a signed-out
 * visitor or a brand previewing its own store; it only decides whether the
 * Follow button shows as already-followed.
 */
export async function storefront(brandId: string, viewerRetailerId?: string) {
  const brand = await prisma.brandProfile.findFirst({
    where: { id: brandId, ...VISIBLE_BRAND },
    select: {
      id: true,
      name: true,
      description: true,
      logoUrl: true,
      province: true,
      createdAt: true,
      _count: { select: { followers: true } },
      products: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          photoUrl: true,
          pricePerPackMinor: true,
          minPacks: true,
          unitsPerPack: true,
          category: true,
          stockPacks: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!brand) {
    // Same 404 whether the brand is missing or not yet onboarded — a visitor
    // has no business distinguishing those.
    throw new AppError(404, 'BRAND_NOT_FOUND', 'No such store.')
  }

  const [rating, productRatings, following] = await Promise.all([
    storeRating(brand.id),
    // One groupBy for the whole shelf rather than one query per product.
    summariesForProducts(brand.products.map((p) => p.id)),
    viewerRetailerId
      ? prisma.brandFollow.findUnique({
          where: {
            retailerId_brandId: { retailerId: viewerRetailerId, brandId },
          },
          select: { id: true },
        })
      : null,
  ])

  return {
    id: brand.id,
    name: brand.name,
    description: brand.description,
    logoUrl: brand.logoUrl,
    province: brand.province,
    memberSince: brand.createdAt,
    rating,
    followerCount: brand._count.followers,
    productCount: brand.products.length,
    // Null rather than false when nobody is signed in: the button should read
    // "Follow" for a visitor, not "not following".
    following: viewerRetailerId ? following !== null : null,
    products: brand.products.map((product) => ({
      ...product,
      rating: productRatings.get(product.id) ?? EMPTY_RATING,
    })),
  }
}
