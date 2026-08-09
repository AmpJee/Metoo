/**
 * Thai address lookup: province → district → sub-district → postcode.
 *
 * Backed by `src/data/thai-addresses.json`, generated from
 * kongvut/thai-province-data (MIT) by `scripts/build-address-data.ts`. That
 * source was chosen over the npm packages for one reason that matters here:
 * it carries English names at every level, and this interface is bilingual.
 * A Thai-only dataset would have meant a Thai-only dropdown inside an English
 * form.
 *
 * The file is already nested and already sorted, so a request is a lookup
 * rather than a group-and-sort. Pure and I/O-free — a JSON import, not a
 * query — which keeps it in the unit-tested layer.
 */

import data from '../data/thai-addresses.json' with { type: 'json' }

/** One province as the generated file stores it. */
interface RawProvince {
  th: string
  en: string
  districts: {
    th: string
    en: string
    subs: { th: string; en: string; zip: string }[]
  }[]
}

const PROVINCES = data as RawProvince[]

/**
 * Indexed by both names, so a caller can pass whichever the reader picked.
 * The frontend sends the Thai name today; matching the English too means an
 * English-locale form does not have to translate before it can ask.
 */
const byName = new Map<string, RawProvince>()
for (const province of PROVINCES) {
  byName.set(province.th, province)
  byName.set(province.en.toLowerCase(), province)
}

export interface SubDistrict {
  name: string
  nameEn: string
  postalCode: string
}

export interface District {
  name: string
  nameEn: string
  subDistricts: SubDistrict[]
}

/**
 * Everything below one province, in one call.
 *
 * The largest is นครราชสีมา; no province is big enough to be worth paging,
 * and fetching the whole subtree means the second and third dropdowns never
 * wait on the network.
 *
 * An unknown name returns an empty list rather than throwing. The caller is
 * filling in a form, and an exception mid-edit helps nobody.
 */
export function districtsFor(province: string): District[] {
  const trimmed = province.trim()
  if (!trimmed) return []

  const match = byName.get(trimmed) ?? byName.get(trimmed.toLowerCase())
  if (!match) return []

  return match.districts.map((district) => ({
    name: district.th,
    nameEn: district.en,
    subDistricts: district.subs.map((sub) => ({
      name: sub.th,
      nameEn: sub.en,
      postalCode: sub.zip,
    })),
  }))
}

/** Every province, for a caller that wants the list from the same source. */
export function provinces(): { name: string; nameEn: string }[] {
  return PROVINCES.map((province) => ({
    name: province.th,
    nameEn: province.en,
  }))
}
