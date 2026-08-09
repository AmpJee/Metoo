import { describe, expect, it } from 'bun:test'
import { districtsFor } from './address.ts'

/**
 * These assert against the real dataset rather than a fixture.
 *
 * The point of this module is that the data is complete and correctly shaped;
 * a fixture would prove the reshaping works while saying nothing about the
 * thing that actually breaks a delivery. Bangkok and a large up-country
 * province are checked because the two are structured differently — เขต/แขวง
 * against อำเภอ/ตำบล — and a bug in one is easy to miss from the other.
 */
describe('districtsFor', () => {
  it('returns nothing for a blank province', () => {
    expect(districtsFor('')).toEqual([])
    expect(districtsFor('   ')).toEqual([])
  })

  it('returns nothing for a province that does not exist', () => {
    expect(districtsFor('Nowhere')).toEqual([])
  })

  it('gives Bangkok all fifty districts', () => {
    const districts = districtsFor('กรุงเทพมหานคร')
    expect(districts).toHaveLength(50)
  })

  it('gives a known Bangkok district its sub-districts and postcode', () => {
    const districts = districtsFor('กรุงเทพมหานคร')
    const khlongSan = districts.find((d) => d.name === 'คลองสาน')

    expect(khlongSan).toBeDefined()
    expect(khlongSan!.subDistricts.map((s) => s.name)).toContain('คลองต้นไทร')
    expect(
      khlongSan!.subDistricts.find((s) => s.name === 'คลองต้นไทร')?.postalCode
    ).toBe('10600')
  })

  it('handles an up-country province with อำเภอ rather than เขต', () => {
    const districts = districtsFor('เชียงใหม่')
    expect(districts.length).toBeGreaterThan(20)

    const muang = districts.find((d) => d.name === 'เมืองเชียงใหม่')
    expect(muang).toBeDefined()
    expect(muang!.subDistricts.length).toBeGreaterThan(0)
  })

  // A prefix match upstream would fold several provinces into one tree —
  // "นครราชสีมา" and "นครปฐม" both begin "นคร".
  it('does not leak rows from a province with a shared prefix', () => {
    const districts = districtsFor('นครปฐม')
    const names = districts.map((d) => d.name)

    expect(names).toContain('เมืองนครปฐม')
    expect(names).not.toContain('เมืองนครราชสีมา')
  })

  it('sorts districts and sub-districts for a reader, not by file order', () => {
    const districts = districtsFor('ภูเก็ต')
    const collator = new Intl.Collator('th')

    const names = districts.map((d) => d.name)
    expect(names).toEqual([...names].sort((a, b) => collator.compare(a, b)))

    for (const district of districts) {
      const subs = district.subDistricts.map((s) => s.name)
      expect(subs).toEqual([...subs].sort((a, b) => collator.compare(a, b)))
    }
  })

  it('gives every postal code as five digits', () => {
    for (const district of districtsFor('ภูเก็ต')) {
      for (const sub of district.subDistricts) {
        expect(sub.postalCode).toMatch(/^\d{5}$/)
      }
    }
  })

  it('lists no sub-district twice within a district', () => {
    for (const district of districtsFor('ขอนแก่น')) {
      const names = district.subDistricts.map((s) => s.name)
      expect(new Set(names).size).toBe(names.length)
    }
  })
})
