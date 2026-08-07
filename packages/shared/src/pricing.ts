/**
 * Volume pricing — buy more packs, pay less per pack.
 *
 * Lives in the shared package, not in the backend's domain layer, for one
 * reason: the seller's tier editor previews a price live ("a retailer
 * ordering 24 pays ฿635/unit") and checkout charges one. Two copies of this
 * arithmetic would eventually disagree, and the disagreement would be the
 * platform quoting one number and invoicing another.
 *
 * The backend re-exports it from domain/volume-pricing.ts so the unit tests
 * stay where CI runs them, and so the domain layer still reads as the place
 * pricing rules live.
 */

export interface PriceTier {
  /** The quantity at which this price starts applying. */
  minPacks: number
  pricePerPackMinor: number
}

export const MAX_TIERS = 6

/**
 * What one pack costs at this quantity.
 *
 * The highest tier whose threshold the order reaches wins. Tiers below the
 * order are irrelevant and tiers above it have not been earned, so this is a
 * simple "best qualifying" lookup rather than anything cumulative — a shop
 * buying 25 packs pays the 20-pack rate on all 25, not a blend.
 *
 * Falls back to the product's own price when no tier qualifies, which is also
 * the answer for a product that has no tiers at all.
 */
export function unitPriceMinor(
  basePriceMinor: number,
  tiers: readonly PriceTier[],
  packs: number
): number {
  let price = basePriceMinor

  for (const tier of tiers) {
    if (packs >= tier.minPacks && tier.pricePerPackMinor < price) {
      price = tier.pricePerPackMinor
    }
  }

  return price
}

/** What this line costs, with volume pricing applied. */
export function lineTotalMinor(
  basePriceMinor: number,
  tiers: readonly PriceTier[],
  packs: number
): number {
  return unitPriceMinor(basePriceMinor, tiers, packs) * packs
}

/**
 * How much the buyer saves at this quantity, against the base price.
 *
 * Zero rather than a negative number when no tier applies: "saves ฿0" is not
 * worth showing, and the caller decides whether to render anything at all.
 */
export function savingsMinor(
  basePriceMinor: number,
  tiers: readonly PriceTier[],
  packs: number
): number {
  const unit = unitPriceMinor(basePriceMinor, tiers, packs)
  return Math.max(0, (basePriceMinor - unit) * packs)
}

export type TierCheck =
  { ok: true } | { ok: false; code: string; value?: number }

/**
 * Are these tiers usable?
 *
 * The rules exist so a shop can never be shown a worse deal for buying more:
 *
 *   - each threshold above the product's own minimum, or the tier is
 *     unreachable and only clutters the screen
 *   - no two tiers at the same threshold, which would make the price depend
 *     on row order
 *   - thresholds ascending and prices descending together, so a bigger
 *     basket never costs more per pack
 *   - every price below the base, or the "tier" is a price rise wearing a
 *     discount's clothes
 */
export function checkPriceTiers(
  tiers: readonly PriceTier[],
  basePriceMinor: number,
  minPacks: number
): TierCheck {
  if (tiers.length > MAX_TIERS) {
    return { ok: false, code: 'TIERS_TOO_MANY' }
  }

  let previousMin = 0
  let previousPrice = basePriceMinor

  for (const tier of tiers) {
    if (!Number.isInteger(tier.minPacks) || tier.minPacks < 1) {
      return { ok: false, code: 'TIER_BAD_QUANTITY', value: tier.minPacks }
    }
    if (
      !Number.isInteger(tier.pricePerPackMinor) ||
      tier.pricePerPackMinor < 1
    ) {
      return {
        ok: false,
        code: 'TIER_BAD_PRICE',
        value: tier.pricePerPackMinor,
      }
    }
    if (tier.minPacks <= minPacks) {
      return { ok: false, code: 'TIER_BELOW_MINIMUM', value: tier.minPacks }
    }
    if (tier.minPacks <= previousMin) {
      return { ok: false, code: 'TIERS_NOT_ASCENDING', value: tier.minPacks }
    }
    if (tier.pricePerPackMinor >= basePriceMinor) {
      return {
        ok: false,
        code: 'TIER_NOT_A_DISCOUNT',
        value: tier.pricePerPackMinor,
      }
    }
    if (tier.pricePerPackMinor >= previousPrice) {
      return {
        ok: false,
        code: 'TIERS_NOT_CHEAPER',
        value: tier.pricePerPackMinor,
      }
    }

    previousMin = tier.minPacks
    previousPrice = tier.pricePerPackMinor
  }

  return { ok: true }
}
