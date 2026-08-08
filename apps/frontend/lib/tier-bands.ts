import type { PriceTier } from '@metoo/shared'

/**
 * The editor's view of a price ladder.
 *
 * Stored, a ladder is a set of thresholds: "from 12, ฿635". Edited, people
 * think in bands — "12 to 47 costs ฿635" — so the form works in bands and
 * converts at the edges.
 *
 * A band's `to` is not stored anywhere. It is always one less than the next
 * band's `from`, which is why editing either end moves the boundary between
 * them: there is only one number there, shown twice.
 */
export interface Band {
  /** Lowest quantity in this band. The first band starts at the product's minimum. */
  from: number
  /** Null on the last band — it runs to any quantity. */
  to: number | null
  pricePerPackMinor: number
}

/**
 * Bands from a product's base price and its tiers.
 *
 * The first band is the base price rather than a stored tier, which is what
 * makes the ladder read as one table instead of "the price, and separately
 * some discounts". Saving reverses it.
 */
export function toBands(
  basePriceMinor: number,
  minPacks: number,
  tiers: readonly PriceTier[]
): Band[] {
  const sorted = [...tiers].sort((a, b) => a.minPacks - b.minPacks)

  const bands: Band[] = [
    {
      from: Math.max(1, minPacks),
      to: null,
      pricePerPackMinor: basePriceMinor,
    },
    ...sorted.map((tier) => ({
      from: tier.minPacks,
      to: null,
      pricePerPackMinor: tier.pricePerPackMinor,
    })),
  ]

  return closeBands(bands)
}

/**
 * Move the ladder to a new minimum order.
 *
 * The first band is the minimum, so raising the minimum has to move it — the
 * editor otherwise kept showing "1 to 9" under a product whose minimum had
 * been set to 20, and a seller had to save and reopen the form before the
 * ladder caught up.
 *
 * Bands that the new minimum has swallowed are dropped. A price break at 10
 * on a product nobody may order fewer than 20 of is unreachable, and it is
 * exactly what `checkPriceTiers` rejects as TIER_BELOW_MINIMUM — keeping it
 * would block saving with an error pointing at a row the seller did not just
 * touch.
 */
export function rebaseBands(bands: Band[], minPacks: number): Band[] {
  const floor = Math.max(1, minPacks)
  const [first, ...rest] = bands
  if (!first) return bands

  return closeBands([
    { ...first, from: floor },
    ...rest.filter((band) => band.from > floor),
  ])
}

/** Each band ends where the next begins; the last one is open. */
export function closeBands(bands: Band[]): Band[] {
  return bands.map((band, i) => ({
    ...band,
    to: i === bands.length - 1 ? null : bands[i + 1]!.from - 1,
  }))
}

/**
 * Back to what the API stores: the first band is the product's price, the
 * rest are tiers.
 */
export function fromBands(bands: Band[]): {
  pricePerPackMinor: number
  priceTiers: PriceTier[]
} {
  const [first, ...rest] = bands

  return {
    pricePerPackMinor: first?.pricePerPackMinor ?? 0,
    priceTiers: rest.map((band) => ({
      minPacks: band.from,
      pricePerPackMinor: band.pricePerPackMinor,
    })),
  }
}

/**
 * Move a boundary by editing a band's `to`.
 *
 * The next band's `from` follows it, because they are the same boundary. A
 * value that would cross a neighbouring boundary is ignored rather than
 * clamped — silently changing a number someone typed is worse than declining
 * to act on it.
 */
export function setBandEnd(bands: Band[], index: number, to: number): Band[] {
  const next = bands[index + 1]
  if (!next) return bands

  const nextFrom = to + 1
  if (nextFrom <= bands[index]!.from) return bands
  if (bands[index + 2] && nextFrom >= bands[index + 2]!.from) return bands

  const updated = bands.map((band, i) =>
    i === index + 1 ? { ...band, from: nextFrom } : band
  )
  return closeBands(updated)
}

/** Same boundary, edited from the other side. */
export function setBandStart(
  bands: Band[],
  index: number,
  from: number
): Band[] {
  if (index === 0) return bands
  if (from <= bands[index - 1]!.from) return bands
  if (bands[index + 1] && from >= bands[index + 1]!.from) return bands

  const updated = bands.map((band, i) =>
    i === index ? { ...band, from } : band
  )
  return closeBands(updated)
}

/** A new band above the last one, at a guessed quantity and a small discount. */
export function addBand(bands: Band[]): Band[] {
  const last = bands[bands.length - 1]!
  return closeBands([
    ...bands,
    {
      from: last.from * 2,
      to: null,
      // A visible starting point the seller then edits — 5% is small enough
      // not to look like a recommendation.
      pricePerPackMinor: Math.max(1, Math.round(last.pricePerPackMinor * 0.95)),
    },
  ])
}

/** The first band is the product's own price and cannot be removed. */
export function removeBand(bands: Band[], index: number): Band[] {
  if (index === 0 || bands.length <= 1) return bands
  return closeBands(bands.filter((_, i) => i !== index))
}
