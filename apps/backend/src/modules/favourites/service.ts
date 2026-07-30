/**
 * Retailer favourites.
 *
 * Thin by design — the interesting constraint is the unique index on
 * (retailerId, productId), which makes favouriting idempotent instead of
 * accumulating duplicate rows on a double-tap.
 */
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../middleware/error.ts'

export { retailerIdForUser } from '../../lib/profile.ts'

export async function list(retailerId: string) {
  const rows = await prisma.favourite.findMany({
    where: { retailerId },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      product: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          unitPriceMinor: true,
          moq: true,
          caseSize: true,
          category: true,
          isActive: true,
          brand: { select: { id: true, name: true } },
        },
      },
    },
  })

  // A favourited product can later be retired. Keep showing it — flagged —
  // rather than having it vanish from the list without explanation.
  return rows.map((row) => ({ favouritedAt: row.createdAt, ...row.product }))
}

export async function add(retailerId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
      brand: { user: { status: 'APPROVED' } },
    },
    select: { id: true },
  })

  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No such product.')
  }

  // upsert, not create: favouriting something already favourited should
  // succeed quietly rather than 409 on the unique index.
  await prisma.favourite.upsert({
    where: { retailerId_productId: { retailerId, productId } },
    update: {},
    create: { retailerId, productId },
  })

  return { favourited: true }
}

export async function remove(retailerId: string, productId: string) {
  // deleteMany rather than delete: removing something not favourited is a
  // no-op, which is what an idempotent toggle needs.
  await prisma.favourite.deleteMany({ where: { retailerId, productId } })
  return { favourited: false }
}
