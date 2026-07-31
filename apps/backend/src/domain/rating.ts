/**
 * Star ratings — pure, no Prisma, no I/O.
 *
 * The design shows a store rating of "4.8" and per-product stars, so averages
 * are rounded to one decimal for display.
 *
 * Unlike money, a rating is a display figure rather than a quantity anyone is
 * owed, so an ordinary float rounded at the edge is fine here. `ratingSum` and
 * `ratingCount` stay integers, which is what keeps the average reproducible
 * from the underlying rows rather than drifting.
 */

export const MIN_RATING = 1
export const MAX_RATING = 5

export type RatingCheck =
  { ok: true } | { ok: false; code: string; message: string }

export function checkRating(rating: number): RatingCheck {
  if (!Number.isInteger(rating)) {
    return {
      ok: false,
      code: 'INVALID_RATING',
      message: 'A rating must be a whole number of stars.',
    }
  }

  if (rating < MIN_RATING || rating > MAX_RATING) {
    return {
      ok: false,
      code: 'RATING_OUT_OF_RANGE',
      message: `A rating must be between ${MIN_RATING} and ${MAX_RATING} stars.`,
    }
  }

  return { ok: true }
}

export interface RatingSummary {
  /** Mean stars to one decimal, or null when nothing has been rated. */
  average: number | null
  count: number
}

/**
 * Summarise a set of ratings.
 *
 * No reviews gives `null`, not `0`. A zero-star average would sort an unrated
 * product below a genuinely badly rated one and render as an empty row of
 * stars, which reads as "bad" rather than "no reviews yet".
 */
export function summarise(ratings: number[]): RatingSummary {
  if (ratings.length === 0) return { average: null, count: 0 }

  const total = ratings.reduce((sum, r) => sum + r, 0)
  return {
    average: roundToOneDecimal(total / ratings.length),
    count: ratings.length,
  }
}

/**
 * Build a summary from pre-aggregated totals.
 *
 * Listing screens aggregate in SQL rather than loading every review, so this
 * takes the sum and count a `groupBy` returns and applies exactly the same
 * rounding as `summarise` — the two must never disagree about what 4.75 is.
 */
export function summariseTotals(
  sum: number | null,
  count: number
): RatingSummary {
  if (count === 0 || sum === null) return { average: null, count: 0 }
  return { average: roundToOneDecimal(sum / count), count }
}

/**
 * Round half away from zero.
 *
 * `Math.round` alone is enough for positive ratings, but going through one
 * helper means the listing and detail screens cannot round differently.
 */
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}
