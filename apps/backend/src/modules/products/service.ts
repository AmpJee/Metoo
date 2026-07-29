/**
 * Brand-owned product management.
 *
 * The rule running through this file: every query is scoped to the calling
 * brand, and a product belonging to someone else is reported as 404, not 403.
 * A 403 would confirm the id exists, which lets a competitor probe for another
 * brand's catalog size and product ids.
 */
import type { Category, Prisma } from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../middleware/error.ts'

export { brandIdForUser } from '../../lib/profile.ts'

export interface ProductInput {
  name: string
  description?: string
  photoUrl?: string
  unitPriceMinor: number
  moq: number
  caseSize: number
  category: Category
  stockQty?: number
  isActive?: boolean
}

export function listForBrand(brandId: string) {
  return prisma.product.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
  })
}

/** Scoped by brandId, so another brand's id simply does not match. */
export async function getForBrand(brandId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, brandId },
  })

  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No such product.')
  }

  return product
}

export function create(brandId: string, input: ProductInput) {
  return prisma.product.create({ data: { ...input, brandId } })
}

export async function update(
  brandId: string,
  productId: string,
  input: Partial<ProductInput>
) {
  // Ownership check first: updateMany with a brandId filter would silently
  // affect zero rows and report success on someone else's id.
  await getForBrand(brandId, productId)

  return prisma.product.update({
    where: { id: productId },
    data: input as Prisma.ProductUpdateInput,
  })
}

/**
 * Retire a product.
 *
 * Soft delete once it has been ordered: OrderItem snapshots the name and price
 * so past orders stay readable either way, but the row is still referenced and
 * a hard delete would break the foreign key. Untouched products are removed
 * outright, so a typo during setup does not linger as dead inventory.
 */
export async function remove(brandId: string, productId: string) {
  await getForBrand(brandId, productId)

  const orderedCount = await prisma.orderItem.count({
    where: { productId },
  })

  if (orderedCount > 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    })
    return { deleted: false, deactivated: true }
  }

  await prisma.product.delete({ where: { id: productId } })
  return { deleted: true, deactivated: false }
}
