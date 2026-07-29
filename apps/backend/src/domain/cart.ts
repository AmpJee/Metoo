/**
 * Cart rules — pure, no Prisma, no I/O.
 *
 * Wholesale is not retail: a brand sells in cases, with a minimum order. Those
 * two constraints are the whole of this file, and they live here rather than
 * inside a handler so they can be unit tested without a database — which is
 * what the "unit tests only, no database in CI" decision requires.
 */

export interface QuantityRules {
  /** Minimum units per order line. */
  moq: number
  /** Units per case; quantities must be exact multiples of this. */
  caseSize: number
}

export type QuantityCheck =
  { ok: true } | { ok: false; code: string; message: string }

/**
 * Validate a requested quantity against a product's wholesale terms.
 *
 * Returns a result rather than throwing: the domain layer has no opinion about
 * HTTP, and the caller turns this into an AppError. Messages name the number
 * the retailer needs, because "invalid quantity" is not actionable.
 */
export function checkQuantity(
  quantity: number,
  rules: QuantityRules
): QuantityCheck {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return {
      ok: false,
      code: 'INVALID_QUANTITY',
      message: 'Quantity must be a positive whole number.',
    }
  }

  if (quantity < rules.moq) {
    return {
      ok: false,
      code: 'BELOW_MOQ',
      message: `This product has a minimum order quantity of ${rules.moq}.`,
    }
  }

  if (rules.caseSize > 1 && quantity % rules.caseSize !== 0) {
    // Suggest the next valid quantity up — it saves the retailer the mental
    // arithmetic and is what the UI wants to offer as a fix.
    const next = Math.ceil(quantity / rules.caseSize) * rules.caseSize
    return {
      ok: false,
      code: 'NOT_CASE_MULTIPLE',
      message: `This product is sold in cases of ${rules.caseSize}. Try ${next}.`,
    }
  }

  return { ok: true }
}

export interface LineItem {
  brandId: string
  unitPriceMinor: number
  quantity: number
}

/** Total for one line, in satang. */
export function lineTotalMinor(item: LineItem): number {
  return item.unitPriceMinor * item.quantity
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
