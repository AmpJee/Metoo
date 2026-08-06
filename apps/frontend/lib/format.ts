/**
 * Money and date formatting.
 *
 * Every monetary value from the API is an Int in satang (100 satang = 1 THB).
 * Always format through `formatBaht` — dividing by 100 inline is how rounding
 * bugs get into a marketplace.
 */

const baht = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** 125000 -> "฿1,250.00" */
export function formatBaht(minor: number): string {
  return `฿${baht.format(minor / 100)}`
}

/** 125000 -> "1,250.00" — for tables where the ฿ sits in the column header. */
export function formatAmount(minor: number): string {
  return baht.format(minor / 100)
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(value: string | Date): string {
  return dateFmt.format(new Date(value))
}

/**
 * A product is sold by the pack; the design shows both figures because a
 * retailer buying wholesale thinks in units but pays per pack.
 */
export function formatPackSummary(unitsPerPack: number, minPacks: number) {
  const units = `${unitsPerPack} ${unitsPerPack === 1 ? 'unit' : 'units'}/pack`
  return minPacks > 1 ? `${units} · min ${minPacks} packs` : units
}
