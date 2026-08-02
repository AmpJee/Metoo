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
import { checkBarcode } from '../../domain/barcode.ts'
import { AppError } from '../../middleware/error.ts'

export { brandIdForUser } from '../../lib/profile.ts'

export interface ProductInput {
  name: string
  description?: string
  photoUrl?: string
  pricePerPackMinor: number
  minPacks: number
  unitsPerPack: number
  category: Category
  stockPacks?: number
  isActive?: boolean
  sku?: string | null
  barcode?: string | null
  packWeightGrams?: number | null
  ingredients?: string | null
  shelfLifeDays?: number | null
}

const BARCODE_MESSAGES: Record<string, string> = {
  BARCODE_NOT_NUMERIC: 'A barcode is digits only.',
  BARCODE_BAD_LENGTH: 'A barcode must be 8, 12, 13 or 14 digits.',
  BARCODE_BAD_CHECK_DIGIT:
    'That barcode’s check digit does not match — it is usually a mistyped or swapped digit.',
}

/**
 * The check digit runs here rather than as a TypeBox pattern because no regex
 * can express it: it is arithmetic over the other digits.
 */
function assertBarcode(barcode: string | null | undefined) {
  if (!barcode) return

  const result = checkBarcode(barcode)
  if (!result.ok) {
    throw new AppError(422, result.code, BARCODE_MESSAGES[result.code]!)
  }
}

/**
 * Prisma reports a duplicate SKU as P2002 on (brandId, sku), which would
 * otherwise surface as an unexplained 500. The brand chose this code, so it is
 * the one party who can be told exactly what collided.
 */
function isDuplicateSku(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  )
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

export async function create(brandId: string, input: ProductInput) {
  assertBarcode(input.barcode)

  try {
    return await prisma.product.create({ data: { ...input, brandId } })
  } catch (error) {
    if (isDuplicateSku(error)) {
      throw new AppError(
        409,
        'SKU_ALREADY_USED',
        `You already have a product with the SKU “${input.sku}”.`
      )
    }
    throw error
  }
}

export async function update(
  brandId: string,
  productId: string,
  input: Partial<ProductInput>
) {
  // Ownership check first: updateMany with a brandId filter would silently
  // affect zero rows and report success on someone else's id.
  await getForBrand(brandId, productId)
  assertBarcode(input.barcode)

  try {
    return await prisma.product.update({
      where: { id: productId },
      data: input as Prisma.ProductUpdateInput,
    })
  } catch (error) {
    if (isDuplicateSku(error)) {
      throw new AppError(
        409,
        'SKU_ALREADY_USED',
        `You already have a product with the SKU “${input.sku}”.`
      )
    }
    throw error
  }
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
