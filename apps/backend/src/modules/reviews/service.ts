/**
 * Product reviews.
 *
 * The rule that makes ratings mean anything: **you can only review what you
 * bought and received.** Without it a brand can rate its own products five
 * stars and a competitor can rate them one, and the number on every card
 * becomes noise.
 *
 * Reviews are public — anyone browsing sees them — but writing one requires a
 * delivered order containing the product.
 */
import { prisma } from '../../config/prisma.ts'
import type { RatingSummary } from '../../domain/rating.ts'
import { checkRating, summarise, summariseTotals } from '../../domain/rating.ts'
import { AppError } from '../../middleware/error.ts'

/**
 * Statuses that count as "received".
 *
 * DELIVERED onward only. An order still in transit has not been seen by the
 * retailer, and CANCELLED never arrived at all.
 */
const RECEIVED_STATUSES = ['DELIVERED', 'SETTLED', 'CLOSED'] as const

const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  retailer: { select: { id: true, shopName: true, province: true } },
}

/**
 * Find the order that entitles this retailer to review this product.
 *
 * Returns the most recent qualifying one, so the review points at the purchase
 * the retailer most likely has in mind.
 */
async function purchaseProof(retailerId: string, productId: string) {
  return prisma.order.findFirst({
    where: {
      retailerId,
      status: { in: [...RECEIVED_STATUSES] },
      items: { some: { productId } },
    },
    select: { id: true },
    orderBy: { deliveredAt: 'desc' },
  })
}

export async function listForProduct(productId: string, limit: number) {
  const [reviews, totals] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      select: reviewSelect,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.review.aggregate({
      where: { productId },
      _sum: { rating: true },
      _count: { _all: true },
    }),
  ])

  return {
    summary: summariseTotals(totals._sum.rating, totals._count._all),
    reviews,
  }
}

/**
 * Write or replace this retailer's review of a product.
 *
 * An upsert rather than create-then-conflict: the unique index is on
 * (retailerId, productId), so submitting again is a change of mind, not an
 * error to report.
 */
export async function upsertReview(params: {
  retailerId: string
  productId: string
  rating: number
  comment?: string
}) {
  const { retailerId, productId, rating, comment } = params

  const check = checkRating(rating)
  if (!check.ok) {
    throw new AppError(422, check.code, check.message)
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  })

  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No such product.')
  }

  const proof = await purchaseProof(retailerId, productId)

  if (!proof) {
    throw new AppError(
      403,
      'PURCHASE_REQUIRED',
      'You can only review a product from an order that has been delivered.'
    )
  }

  return prisma.review.upsert({
    where: { retailerId_productId: { retailerId, productId } },
    update: { rating, comment: comment?.trim() || null },
    create: {
      retailerId,
      productId,
      orderId: proof.id,
      rating,
      comment: comment?.trim() || null,
    },
    select: reviewSelect,
  })
}

export async function deleteOwnReview(retailerId: string, productId: string) {
  // deleteMany scoped to the retailer: one retailer cannot remove another's
  // review, and deleting one that does not exist is a no-op rather than a 404.
  await prisma.review.deleteMany({ where: { retailerId, productId } })
  return { deleted: true }
}

/** This retailer's own review, for pre-filling the form. */
export async function ownReview(retailerId: string, productId: string) {
  const [review, proof] = await Promise.all([
    prisma.review.findUnique({
      where: { retailerId_productId: { retailerId, productId } },
      select: reviewSelect,
    }),
    purchaseProof(retailerId, productId),
  ])

  return { canReview: proof !== null, review }
}

/**
 * A brand's store rating: every review across its products.
 *
 * The design shows one figure ("4.8") beside the brand name rather than a
 * separate store-level review, so it is derived from product reviews instead
 * of being its own thing to collect.
 */
export async function storeRating(brandId: string) {
  const totals = await prisma.review.aggregate({
    where: { product: { brandId } },
    _sum: { rating: true },
    _count: { _all: true },
  })

  return summariseTotals(totals._sum.rating, totals._count._all)
}

/**
 * Store ratings for many brands at once.
 *
 * Prisma cannot group by a relation field, so this aggregates the brand id in
 * SQL directly. One query for a whole brand list rather than one per brand.
 */
export async function storeRatingsForBrands(brandIds: string[]) {
  if (brandIds.length === 0) return new Map<string, RatingSummary>()

  const rows = await prisma.$queryRaw<
    Array<{ brandId: string; sum: bigint; count: bigint }>
  >`
    SELECT p."brandId" AS "brandId",
           SUM(r."rating")::bigint AS sum,
           COUNT(*)::bigint AS count
    FROM reviews r
    JOIN products p ON p.id = r."productId"
    WHERE p."brandId" = ANY(${brandIds})
    GROUP BY p."brandId"
  `

  return new Map(
    rows.map((row) => [
      row.brandId,
      summariseTotals(Number(row.sum), Number(row.count)),
    ])
  )
}

/**
 * Rating summaries for many products at once.
 *
 * One groupBy for a whole page of catalog cards. Loading reviews per product
 * would be an N+1 on the busiest screen in the app.
 */
export async function summariesForProducts(productIds: string[]) {
  if (productIds.length === 0)
    return new Map<string, ReturnType<typeof summarise>>()

  const rows = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds } },
    _sum: { rating: true },
    _count: { _all: true },
  })

  return new Map(
    rows.map((row) => [
      row.productId,
      summariseTotals(row._sum.rating, row._count._all),
    ])
  )
}
