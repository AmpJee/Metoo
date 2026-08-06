/**
 * Cart rules — pure, no Prisma, no I/O.
 *
 * Wholesale here is sold **by the pack**. A product is priced per pack, ordered
 * in packs, and carries a minimum number of packs. `unitsPerPack` is
 * descriptive — it tells a retailer what is inside one pack ("5 units/pack")
 * and never constrains the quantity they may order.
 *
 * That last point is deliberate: an earlier version required the ordered
 * quantity to be an exact multiple of the pack size, which would reject 6 packs
 * of a 5-units/pack product. The design allows exactly that, so the rule is
 * gone.
 */

export interface PackRules {
  /** Fewest packs a retailer may order. */
  minPacks: number
}

export type QuantityCheck =
  { ok: true } | { ok: false; code: string; message: string }

/**
 * Validate a requested pack count against a product's wholesale terms.
 *
 * Returns a result rather than throwing: the domain layer has no opinion about
 * HTTP, and the caller turns this into an AppError. The message names the
 * number the retailer needs, because "invalid quantity" is not actionable.
 */
export function checkQuantity(packs: number, rules: PackRules): QuantityCheck {
  if (!Number.isInteger(packs) || packs <= 0) {
    return {
      ok: false,
      code: 'INVALID_QUANTITY',
      message: 'Quantity must be a positive whole number of packs.',
    }
  }

  if (packs < rules.minPacks) {
    return {
      ok: false,
      code: 'BELOW_MIN_PACKS',
      message: `This product has a minimum order of ${rules.minPacks} packs.`,
    }
  }

  return { ok: true }
}

export interface LineItem {
  brandId: string
  /** Price of one pack, in satang. */
  pricePerPackMinor: number
  /** Number of packs ordered. */
  packs: number
}

/** Total for one line, in satang. */
export function lineTotalMinor(item: LineItem): number {
  return item.pricePerPackMinor * item.packs
}

/**
 * Group cart lines by brand and subtotal each group.
 *
 * A cart spans brands but an order never does — checkout creates one order per
 * brand. Doing that grouping here means the cart screen already shows the split
 * the retailer is about to get, and checkout consumes the same function rather
 * than reimplementing it.
 */
export function groupByBrand<T extends LineItem>(
  items: T[]
): Array<{ brandId: string; items: T[]; subtotalMinor: number }> {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const existing = groups.get(item.brandId)
    if (existing) existing.push(item)
    else groups.set(item.brandId, [item])
  }

  return [...groups].map(([brandId, groupItems]) => ({
    brandId,
    items: groupItems,
    subtotalMinor: groupItems.reduce(
      (total, item) => total + lineTotalMinor(item),
      0
    ),
  }))
}
