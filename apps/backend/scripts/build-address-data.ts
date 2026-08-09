/**
 * Regenerates `src/data/thai-addresses.json` from kongvut/thai-province-data.
 *
 *   bun run scripts/build-address-data.ts
 *
 * Run this when Thailand gains or renames an administrative area, which is
 * roughly never — the generated file is committed so a build never depends on
 * GitHub being reachable, and so a change to the data shows up as a reviewable
 * diff rather than appearing silently on the next install.
 *
 * The upstream raw files total about 2.5MB, most of it timestamps, geography
 * ids and lat/long we have no use for. This keeps the six fields an address
 * form actually needs and nests them, which drops it by roughly four fifths
 * and removes the joins from the request path.
 *
 * Source: https://github.com/kongvut/thai-province-data (MIT).
 */

const BASE =
  'https://raw.githubusercontent.com/kongvut/thai-province-data/master/data/raw'

interface RawProvince {
  id: number
  name_th: string
  name_en: string
  deleted_at: string | null
}

interface RawDistrict {
  id: number
  name_th: string
  name_en: string
  province_id: number
  deleted_at: string | null
}

interface RawSubDistrict {
  id: number
  name_th: string
  name_en: string
  district_id: number
  zip_code: number
  deleted_at: string | null
}

async function fetchJson<T>(file: string): Promise<T[]> {
  const response = await fetch(`${BASE}/${file}.json`)
  if (!response.ok) {
    throw new Error(`${file}.json → HTTP ${response.status}`)
  }
  return (await response.json()) as T[]
}

const [provinces, districts, subDistricts] = await Promise.all([
  fetchJson<RawProvince>('provinces'),
  fetchJson<RawDistrict>('districts'),
  fetchJson<RawSubDistrict>('sub_districts'),
])

// The upstream soft-deletes rather than removing, so a dissolved area would
// otherwise keep appearing in a dropdown years after it stopped existing.
const live = <T extends { deleted_at: string | null }>(rows: T[]) =>
  rows.filter((row) => row.deleted_at === null)

const liveProvinces = live(provinces)
const liveDistricts = live(districts)
const liveSubDistricts = live(subDistricts)

// Thai collation, once here, so the API never sorts per request.
const collator = new Intl.Collator('th')
const byThai = <T extends { th: string }>(a: T, b: T) =>
  collator.compare(a.th, b.th)

const subsByDistrict = new Map<
  number,
  { th: string; en: string; zip: string }[]
>()
for (const sub of liveSubDistricts) {
  const list = subsByDistrict.get(sub.district_id) ?? []
  list.push({
    th: sub.name_th,
    en: sub.name_en,
    // A string, not a number: postcodes are digit strings and 01xxx must not
    // lose its leading zero. None do today, but the column it lands in is text.
    zip: String(sub.zip_code).padStart(5, '0'),
  })
  subsByDistrict.set(sub.district_id, list)
}

const districtsByProvince = new Map<
  number,
  { th: string; en: string; subs: { th: string; en: string; zip: string }[] }[]
>()
for (const district of liveDistricts) {
  const list = districtsByProvince.get(district.province_id) ?? []
  list.push({
    th: district.name_th,
    en: district.name_en,
    subs: (subsByDistrict.get(district.id) ?? []).sort(byThai),
  })
  districtsByProvince.set(district.province_id, list)
}

const output = liveProvinces
  .map((province) => ({
    th: province.name_th,
    en: province.name_en,
    districts: (districtsByProvince.get(province.id) ?? []).sort(byThai),
  }))
  .sort(byThai)

const target = new URL('../src/data/thai-addresses.json', import.meta.url)
await Bun.write(target, JSON.stringify(output))

const bytes = (await Bun.file(target).arrayBuffer()).byteLength
const districtCount = output.reduce((n, p) => n + p.districts.length, 0)
const subCount = output.reduce(
  (n, p) => n + p.districts.reduce((m, d) => m + d.subs.length, 0),
  0
)

// Deliberately console.log: this is a CLI script whose whole job is to report
// what it wrote, and a silent generator gives you nothing to sanity-check.
// eslint-disable-next-line no-console
console.log(
  `wrote ${output.length} provinces, ${districtCount} districts, ` +
    `${subCount} sub-districts — ${(bytes / 1024).toFixed(0)}KB`
)
