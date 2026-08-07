/**
 * Money and date formatting.
 *
 * Every monetary value from the API is an Int in satang (100 satang = 1 THB).
 * Always format through `formatBaht` — dividing by 100 inline is how rounding
 * bugs get into a marketplace.
 */

import type { Locale, Translate } from '@/lib/i18n'

const baht = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * 125000 -> "฿1,250.00"
 *
 * Not locale-aware, and deliberately so: Thai groups thousands with commas and
 * separates decimals with a dot, exactly as en-US does. Switching to a th-TH
 * formatter would produce byte-identical output and buy a second code path for
 * nothing.
 */
export function formatBaht(minor: number): string {
  return `฿${baht.format(minor / 100)}`
}

/** 125000 -> "1,250.00" — for tables where the ฿ sits in the column header. */
export function formatAmount(minor: number): string {
  return baht.format(minor / 100)
}

/**
 * Thai reads dates in the Buddhist era, which is what `th-TH` gives by default
 * — 2026 CE renders as 2569. That is the year on every Thai invoice and ID
 * card, so it is the year a shopkeeper expects to see.
 *
 * Note it does NOT switch to Thai numerals; that needs an explicit
 * `-u-nu-thai`, and we do not want it. Latin digits keep an order's date
 * legible beside its `MT-260807-…` order number.
 */
const FORMATS: Record<Locale, Intl.DateTimeFormatOptions & { locale: string }> =
  {
    en: { locale: 'en-GB', day: 'numeric', month: 'short', year: 'numeric' },
    th: { locale: 'th-TH', day: 'numeric', month: 'short', year: 'numeric' },
  }

// Built once per locale. Constructing an Intl.DateTimeFormat is expensive
// enough to matter on the admin orders table, which renders one date per row.
const cache = new Map<Locale, Intl.DateTimeFormat>()

function formatter(locale: Locale): Intl.DateTimeFormat {
  const hit = cache.get(locale)
  if (hit) return hit

  const { locale: tag, ...options } = FORMATS[locale]
  const made = new Intl.DateTimeFormat(tag, options)
  cache.set(locale, made)
  return made
}

/**
 * Defaults to English rather than requiring a locale, so a call site that has
 * not been translated yet still compiles and still renders a date.
 */
export function formatDate(
  value: string | Date,
  locale: Locale = 'en'
): string {
  return formatter(locale).format(new Date(value))
}

/**
 * A product is sold by the pack; the design shows both figures because a
 * retailer buying wholesale thinks in units but pays per pack.
 *
 * Takes the translator rather than the locale because it assembles a sentence
 * out of two keys, and the join is a plain "·" in both languages.
 */
export function formatPackSummary(
  unitsPerPack: number,
  minPacks: number,
  t: Translate
) {
  const units = t(
    unitsPerPack === 1 ? 'card.unitPerPack' : 'card.unitsPerPack',
    {
      n: unitsPerPack,
    }
  )
  return minPacks > 1
    ? `${units} · ${t('card.minPacks', { n: minPacks })}`
    : units
}
