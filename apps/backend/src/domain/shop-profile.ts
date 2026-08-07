/**
 * Whether a retailer has told us enough about their shop to trade.
 *
 * Pure — no Prisma, no I/O — so the rule is unit-tested and lives in one
 * place. The admin console's Retailers table has a column for each of these,
 * and until now nothing could fill them in: they were writable only by an
 * admin, so every self-registered shop showed a row of dashes.
 *
 * They are operational, not bureaucratic. Which zone a shop is in and what
 * delivery window it can accept decide whether a courier run is even
 * possible; capacity and what it already stocks decide which brands to
 * introduce. Collecting them after the first order means finding out the
 * order could not be delivered.
 */

export interface ShopProfile {
  shopType: string | null
  zone: string | null
  currentProducts: string | null
  monthlyCapacity: number | null
  preferredPayment: string | null
  deliveryWindow: string | null
}

/**
 * The fields a retailer must supply before checking out, in the order the
 * form shows them, each with the label the console uses for that column.
 *
 * `paymentReliability` is deliberately absent even though the table has a
 * column for it: that is a track record an admin maintains from experience,
 * not something a shop declares about itself.
 */
export const REQUIRED_SHOP_FIELDS = [
  ['shopType', 'Shop type'],
  ['zone', 'Location or zone'],
  ['currentProducts', 'What you currently stock'],
  ['monthlyCapacity', 'Monthly capacity'],
  ['preferredPayment', 'Preferred payment'],
  ['deliveryWindow', 'Delivery window'],
] as const satisfies readonly [keyof ShopProfile, string][]

/**
 * Which required fields are still missing.
 *
 * Returns the field names rather than a boolean so the caller can name them —
 * "complete your shop profile" without saying which part is a dead end.
 *
 * An empty string counts as missing. A text column that was set and then
 * cleared holds "" rather than null, and a shop whose zone is blank is no
 * more deliverable than one that never answered.
 */
export function missingShopFields(
  profile: ShopProfile
): Array<{ field: keyof ShopProfile; label: string }> {
  return REQUIRED_SHOP_FIELDS.filter(([field]) => {
    const value = profile[field]
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    // Capacity of zero is a shop that cannot take an order, not a blank form,
    // but it is still not a usable answer.
    return value <= 0
  }).map(([field, label]) => ({ field, label }))
}

/** Can this retailer check out? */
export function shopProfileComplete(profile: ShopProfile): boolean {
  return missingShopFields(profile).length === 0
}
