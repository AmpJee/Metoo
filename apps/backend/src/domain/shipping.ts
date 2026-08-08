/**
 * Delivery pricing.
 *
 * The rule itself lives in @metoo/shared, because the product page estimates
 * a delivery fee in the browser and checkout charges one on the server — two
 * implementations would eventually disagree, and that disagreement is a shop
 * being shown one number and invoiced another.
 *
 * Re-exported here so the domain layer still reads as the home of money
 * rules, and so shipping.test.ts sits with the other domain tests that CI
 * runs without a database.
 */
export {
  DEFAULT_PACK_WEIGHT_GRAMS,
  FREE_SHIPPING_OVER_MINOR,
  OVER_TOP_BAND_PER_KG_MINOR,
  SHIPPING_BANDS,
  amountToFreeShippingMinor,
  parcelWeightGrams,
  shippingFeeMinor,
  type ShippableLine,
} from '@metoo/shared'
