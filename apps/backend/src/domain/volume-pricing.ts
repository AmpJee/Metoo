/**
 * Volume pricing.
 *
 * The rule itself lives in @metoo/shared, because the seller's tier editor
 * previews a price in the browser and checkout charges one on the server —
 * two implementations would eventually disagree, and that disagreement is a
 * shop being quoted one number and invoiced another.
 *
 * Re-exported here so the domain layer still reads as the home of pricing
 * rules, and so volume-pricing.test.ts sits with the other domain tests that
 * CI runs without a database.
 */
export {
  MAX_TIERS,
  checkPriceTiers,
  lineTotalMinor,
  quickPickQuantities,
  savingsMinor,
  unitPriceMinor,
  type PriceTier,
  type TierCheck,
} from '@metoo/shared'
