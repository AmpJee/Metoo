/**
 * What delivery costs the retailer — pure, no Prisma, no I/O.
 *
 * Priced per BRAND order, by parcel weight, the way Shopee does it: a basket
 * spanning three brands is three parcels leaving three different places, so it
 * is three delivery fees. The order split already works that way, so the fee
 * lands naturally on each order rather than needing to be divided up after.
 *
 * The fee is resolved at CHECKOUT and snapshotted onto the order, for the same
 * reason the commission rate is: payment is a single manual bank transfer
 * against a total the buyer reads off the screen. A fee that arrived later
 * would mean asking them to transfer twice, and the slip they have already
 * sent would no longer match what they owe.
 *
 * metoo collects this and pays the courier — the platform arranges pickup and
 * delivery, and `Order.deliveryCostMinor` records what that actually cost. The
 * brand's payout is unaffected: it stays subtotal minus commission, and
 * commission is charged on goods, never on delivery.
 */

/**
 * Weight bands, in the shape Thai couriers actually quote.
 *
 * ONE table for the whole platform, because the platform books the courier.
 * These are the numbers to change when a rate card changes — nothing else in
 * the codebase decides a delivery price.
 */
export const SHIPPING_BANDS: readonly { maxGrams: number; feeMinor: number }[] =
  [
    { maxGrams: 1_000, feeMinor: 3_500 }, // ฿35
    { maxGrams: 3_000, feeMinor: 5_500 }, // ฿55
    { maxGrams: 5_000, feeMinor: 7_500 }, // ฿75
    { maxGrams: 10_000, feeMinor: 11_500 }, // ฿115
    { maxGrams: 20_000, feeMinor: 18_500 }, // ฿185
  ]

/** Above the last band, couriers price by the kilo. Rounded up, as they do. */
export const OVER_TOP_BAND_PER_KG_MINOR = 1_000 // ฿10 per kg

/**
 * Free delivery once a brand order is big enough.
 *
 * Per brand, not per basket: the threshold has to be reachable by the thing it
 * is meant to encourage, which is a bigger order from one brand. A basket
 * total would hand free delivery on a ฿200 order to anyone who also bought
 * from someone else.
 */
export const FREE_SHIPPING_OVER_MINOR = 300_000 // ฿3,000

/**
 * What a pack weighs when the seller has not said.
 *
 * `packWeightGrams` is nullable and, at the time this was written, not one
 * live product had it filled in — so without a fallback every order would
 * price at zero. One kilo is deliberately a middle band rather than a
 * flattering one: undercharging costs the platform real money on every order,
 * and the fix is for sellers to enter the weight, which the product form now
 * requires.
 */
export const DEFAULT_PACK_WEIGHT_GRAMS = 1_000

export interface ShippableLine {
  /** Null when the seller has not recorded it. */
  packWeightGrams: number | null
  packs: number
}

/** Total weight of one brand's parcel. */
export function parcelWeightGrams(lines: readonly ShippableLine[]): number {
  return lines.reduce(
    (grams, line) =>
      grams + (line.packWeightGrams ?? DEFAULT_PACK_WEIGHT_GRAMS) * line.packs,
    0
  )
}

/**
 * The delivery fee for one brand order.
 *
 * Returns minor units, like every other money value here.
 */
export function shippingFeeMinor(params: {
  weightGrams: number
  subtotalMinor: number
}): number {
  const { weightGrams, subtotalMinor } = params

  if (subtotalMinor >= FREE_SHIPPING_OVER_MINOR) return 0

  // An empty parcel is not a delivery. Guards the case where every line has
  // zero packs, which the cart should not allow but arithmetic should survive.
  if (weightGrams <= 0) return 0

  const band = SHIPPING_BANDS.find((b) => weightGrams <= b.maxGrams)
  if (band) return band.feeMinor

  const top = SHIPPING_BANDS[SHIPPING_BANDS.length - 1]!
  const excessKg = Math.ceil((weightGrams - top.maxGrams) / 1_000)
  return top.feeMinor + excessKg * OVER_TOP_BAND_PER_KG_MINOR
}

/**
 * How much more this brand order needs before delivery is free.
 *
 * Zero once it qualifies. The cart shows this because "spend ฿310 more for
 * free delivery" is the one number that changes what someone puts in a basket.
 */
export function amountToFreeShippingMinor(subtotalMinor: number): number {
  return Math.max(0, FREE_SHIPPING_OVER_MINOR - subtotalMinor)
}
