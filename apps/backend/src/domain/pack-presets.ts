/**
 * The "Amount" quick-pick buttons on the product page — pure, no I/O.
 *
 * The design shows a row of them (5 · 10 · 20 · 30 · 40) beside the stepper.
 * They are per-product rather than a fixed set, because a brand selling a
 * 12-pack minimum and one selling singles cannot offer the same shortcuts.
 *
 * Which is exactly why they need checking: a preset below the product's own
 * minimum renders a button that always fails. The retailer taps it, the cart
 * rejects the quantity, and nothing on screen explains why.
 */

export type PresetsCheck =
  | { ok: true }
  | {
      ok: false
      code:
        'PRESETS_TOO_MANY' | 'PRESETS_NOT_ASCENDING' | 'PRESETS_BELOW_MINIMUM'
      /** The offending value, for a message that names it. */
      value?: number
    }

/** Five fits the design's row; eight is generous before it wraps badly. */
export const MAX_PRESETS = 8

export function checkPackPresets(
  presets: readonly number[],
  minPacks: number
): PresetsCheck {
  if (presets.length > MAX_PRESETS) {
    return { ok: false, code: 'PRESETS_TOO_MANY' }
  }

  for (const [i, value] of presets.entries()) {
    if (value < minPacks) {
      return { ok: false, code: 'PRESETS_BELOW_MINIMUM', value }
    }

    // Strictly ascending, which rules out duplicates and unsorted input in one
    // pass. The buttons are rendered in array order, so the array *is* the
    // display order — sorting it for the brand would silently rearrange
    // something they chose.
    if (i > 0 && value <= presets[i - 1]!) {
      return { ok: false, code: 'PRESETS_NOT_ASCENDING', value }
    }
  }

  return { ok: true }
}
