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
import { MAX_PRESETS, checkPackPresets } from '../../domain/pack-presets.ts'
import type { PriceTier } from '../../domain/volume-pricing.ts'
import { MAX_TIERS, checkPriceTiers } from '../../domain/volume-pricing.ts'
import { AppError } from '../../middleware/error.ts'
import type { StagedImage } from '../product-images/service.ts'
import { attachStagedImages } from '../product-images/service.ts'

export { brandIdForUser } from '../../lib/profile.ts'

export interface ProductInput {
  name: string
  description?: string
  photoUrl?: string
  pricePerPackMinor: number
  /** Omitted on create means Prisma's @default(1). Never defaulted at the edge. */
  minPacks?: number
  unitsPerPack?: number
  category: Category
  stockPacks?: number
  isActive?: boolean
  sku?: string | null
  barcode?: string | null
  packWeightGrams?: number | null
  ingredients?: string | null
  shelfLifeDays?: number | null
  packPresets?: number[]
  priceTiers?: PriceTier[]
}

/** Cheapest threshold first, so the API returns a readable ladder. */
const tierSelect = {
  select: { minPacks: true, pricePerPackMinor: true },
  orderBy: { minPacks: 'asc' },
} satisfies Prisma.Product$priceTiersArgs

const TIER_MESSAGES: Record<string, (v?: number) => string> = {
  TIERS_TOO_MANY: () => `At most ${MAX_TIERS} volume prices.`,
  TIER_BAD_QUANTITY: (v) => `${v} is not a usable quantity.`,
  TIER_BAD_PRICE: (v) => `${v} is not a usable price.`,
  TIER_BELOW_MINIMUM: (v) =>
    `A ${v}-pack tier is below this product’s minimum order, so nobody could ever reach it.`,
  TIERS_NOT_ASCENDING: (v) =>
    `Volume quantities must increase; ${v} does not follow the one before it.`,
  TIERS_NOT_CHEAPER: () =>
    'Each tier must be cheaper than the one before — buying more should never cost more per pack.',
  TIER_NOT_A_DISCOUNT: () =>
    'A volume price must be below the product’s own price, or it is not a discount.',
}

/**
 * Validated against the *effective* base price and minimum, not the stored
 * ones: a single PATCH can change the price, the minimum and the ladder at
 * once, and checking against the old values would let through a combination
 * that is invalid the moment it lands.
 */
function assertPriceTiers(
  tiers: PriceTier[] | undefined,
  basePriceMinor: number,
  minPacks: number
) {
  if (!tiers) return

  const result = checkPriceTiers(tiers, basePriceMinor, minPacks)
  if (!result.ok) {
    throw new AppError(
      422,
      result.code,
      TIER_MESSAGES[result.code]!(result.value)
    )
  }
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

const PRESET_MESSAGES: Record<string, (v?: number) => string> = {
  PRESETS_TOO_MANY: () =>
    `At most ${MAX_PRESETS} quick-pick amounts — the row does not fit more.`,
  PRESETS_NOT_ASCENDING: (v) =>
    `Quick-pick amounts must increase; ${v} does not follow the one before it.`,
  PRESETS_BELOW_MINIMUM: (v) =>
    `${v} is below this product’s minimum order, so that button could never be used.`,
}

/**
 * Checked against the *effective* minimum, not the stored one: a PATCH may be
 * raising minPacks and setting presets in the same request, and validating
 * against the old minimum would let through a pairing that is invalid the
 * moment it lands.
 */
function assertPackPresets(
  presets: number[] | undefined,
  effectiveMinPacks: number
) {
  if (!presets) return

  const result = checkPackPresets(presets, effectiveMinPacks)
  if (!result.ok) {
    throw new AppError(
      422,
      result.code,
      PRESET_MESSAGES[result.code]!(result.value)
    )
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
    include: { priceTiers: tierSelect },
    orderBy: { createdAt: 'desc' },
  })
}

/** Scoped by brandId, so another brand's id simply does not match. */
export async function getForBrand(brandId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, brandId },
    include: { priceTiers: tierSelect },
  })

  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No such product.')
  }

  return product
}

/**
 * Create a product, optionally with photos already uploaded.
 *
 * The Add Product form uploads while the product has no id, so it sends back
 * the staged storage keys here. Product and images are written in one
 * transaction: a bad key rolls the whole thing back, and the brand fixes the
 * form rather than finding a half-built product in their catalog.
 */
export async function create(
  brandId: string,
  input: ProductInput,
  images: StagedImage[] = []
) {
  assertBarcode(input.barcode)
  // Mirrors Prisma's @default(1) for the omitted case.
  assertPackPresets(input.packPresets, input.minPacks ?? 1)
  assertPriceTiers(
    input.priceTiers,
    input.pricePerPackMinor,
    input.minPacks ?? 1
  )

  const { priceTiers, ...fields } = input

  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...fields,
          brandId,
          ...(priceTiers?.length ? { priceTiers: { create: priceTiers } } : {}),
        },
        include: { priceTiers: tierSelect },
      })

      const cover = await attachStagedImages(tx, {
        brandId,
        productId: product.id,
        images,
      })

      // photoUrl is the denormalised cover; an explicit photoUrl in the body
      // still wins, so a brand can point at an external image if it wants one.
      if (cover && !input.photoUrl) {
        return tx.product.update({
          where: { id: product.id },
          data: { photoUrl: cover },
          include: { priceTiers: tierSelect },
        })
      }

      return product
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

export async function update(
  brandId: string,
  productId: string,
  input: Partial<ProductInput>
) {
  // Ownership check first: updateMany with a brandId filter would silently
  // affect zero rows and report success on someone else's id.
  const existing = await getForBrand(brandId, productId)
  assertBarcode(input.barcode)

  // A single PATCH can raise minPacks and set presets at once, so validate
  // against whichever minimum the row is about to have.
  const effectiveMinPacks = input.minPacks ?? existing.minPacks
  assertPackPresets(input.packPresets, effectiveMinPacks)

  // Raising minPacks alone can strand presets that were valid before. Rejecting
  // is better than silently keeping a button that no longer works.
  if (input.minPacks !== undefined && input.packPresets === undefined) {
    assertPackPresets(existing.packPresets, effectiveMinPacks)
  }

  // Same reasoning for the ladder: price, minimum and tiers can all move in
  // one PATCH, so validate against what the row is about to be.
  const effectivePrice = input.pricePerPackMinor ?? existing.pricePerPackMinor
  assertPriceTiers(input.priceTiers, effectivePrice, effectiveMinPacks)

  // Changing the price or the minimum can strand a ladder that was fine
  // before. Re-check the stored one rather than leave a tier that is now
  // above the base price quietly overcharging nobody and confusing everybody.
  if (input.priceTiers === undefined) {
    assertPriceTiers(existing.priceTiers, effectivePrice, effectiveMinPacks)
  }

  const { priceTiers, ...fields } = input

  try {
    return await prisma.product.update({
      where: { id: productId },
      data: {
        ...(fields as Prisma.ProductUpdateInput),
        // Replaced wholesale rather than merged: the form submits the ladder
        // it wants, and a partial merge would make deleting a tier
        // impossible.
        ...(priceTiers
          ? { priceTiers: { deleteMany: {}, create: priceTiers } }
          : {}),
      },
      include: { priceTiers: tierSelect },
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
