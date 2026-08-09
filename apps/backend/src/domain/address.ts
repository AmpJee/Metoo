/**
 * Thai address lookup: province → district → sub-district → postcode.
 *
 * The data comes from `thai-address-database`, which is a flat list of
 * `{ district, amphoe, province, zipcode }` rows. Two things about it need
 * saying, because both are easy to get wrong:
 *
 *   1. Its field names are one level off from ours. What it calls `district`
 *      is the sub-district (แขวง in Bangkok, ตำบล elsewhere) and what it calls
 *      `amphoe` is the district (เขต / อำเภอ). `RawRow` below is the only
 *      place that mapping lives; nothing downstream sees their names.
 *
 *   2. A sub-district can carry more than one postcode. Three do. The tree
 *      keeps whichever comes first and the caller can still type over it —
 *      guessing is better than an empty box, and refusing to guess because
 *      three rows are ambiguous would cost the other 7,417.
 *
 * Pure and I/O-free so it stays in the unit-tested layer: the dataset is a
 * module import, not a query.
 */

import { searchAddressByProvince } from 'thai-address-database'

/** One row as the upstream package spells it. See note 1 above. */
interface RawRow {
  /** Sub-district — แขวง / ตำบล. */
  district: string
  /** District — เขต / อำเภอ. */
  amphoe: string
  province: string
  zipcode: number
}

export interface SubDistrict {
  name: string
  postalCode: string
}

export interface District {
  name: string
  subDistricts: SubDistrict[]
}

/**
 * No province has more than 289 rows, so one province is the right unit to
 * fetch — under 8KB of JSON, after which the whole cascade runs locally with
 * no spinner between the two selects.
 */
export function districtsFor(province: string): District[] {
  const trimmed = province.trim()
  if (!trimmed) return []

  // The limit is a cap, not a page size: 289 is the largest real province, so
  // anything above that returns everything.
  const rows = searchAddressByProvince(trimmed, 1000) as RawRow[]

  const byDistrict = new Map<string, SubDistrict[]>()

  for (const row of rows) {
    // A search is a prefix match upstream, so "นคร" would pull several
    // provinces. Only exact matches belong in this province's tree.
    if (row.province !== trimmed) continue

    const list = byDistrict.get(row.amphoe)
    const entry = {
      name: row.district,
      postalCode: String(row.zipcode),
    }

    if (!list) byDistrict.set(row.amphoe, [entry])
    else if (!list.some((s) => s.name === entry.name)) list.push(entry)
  }

  // Sorted with Thai collation, because the raw order is the order the
  // upstream file happens to be written in and a shopkeeper scanning a select
  // of 80 sub-districts needs them alphabetical.
  const collator = new Intl.Collator('th')

  return [...byDistrict.entries()]
    .map(([name, subDistricts]) => ({
      name,
      subDistricts: subDistricts.sort((a, b) =>
        collator.compare(a.name, b.name)
      ),
    }))
    .sort((a, b) => collator.compare(a.name, b.name))
}
