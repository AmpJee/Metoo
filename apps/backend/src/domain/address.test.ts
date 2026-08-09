import { describe, expect, it } from 'bun:test'
import { districtsFor, provinces } from './address.ts'

/**
 * These assert against the real generated dataset rather than a fixture.
 *
 * The point of this module is that the data is complete and correctly shaped;
 * a fixture would prove the reshaping works while saying nothing about the
 * thing that actually breaks a delivery. Bangkok and an up-country province
 * are both covered because the two are structured differently — เขต/แขวง
 * against อำเภอ/ตำบล — and a bug in one is easy to miss from the other.
 */
describe('provinces', () => {
  it('has all 77', () => {
    expect(provinces()).toHaveLength(77)
  })

  it('carries both names for every one', () => {
    for (const province of provinces()) {
      expect(province.name.length).toBeGreaterThan(0)
      expect(province.nameEn.length).toBeGreaterThan(0)
    }
  })
})

describe('districtsFor', () => {
  it('returns nothing for a blank province', () => {
    expect(districtsFor('')).toEqual([])
    expect(districtsFor('   ')).toEqual([])
  })

  it('returns nothing for a province that does not exist', () => {
    expect(districtsFor('Nowhere')).toEqual([])
  })

  it('accepts the English name as well as the Thai', () => {
    // The form sends whichever the reader picked, so both have to resolve.
    expect(districtsFor('Bangkok')).toEqual(districtsFor('กรุงเทพมหานคร'))
    expect(districtsFor('bangkok')).toHaveLength(50)
  })

  it('gives Bangkok all fifty districts', () => {
    expect(districtsFor('กรุงเทพมหานคร')).toHaveLength(50)
  })

  it('gives a known Bangkok district its sub-districts and postcode', () => {
    const phraNakhon = districtsFor('กรุงเทพมหานคร').find(
      (d) => d.name === 'เขตพระนคร'
    )

    expect(phraNakhon).toBeDefined()
    const palace = phraNakhon!.subDistricts.find(
      (s) => s.name === 'พระบรมมหาราชวัง'
    )
    expect(palace?.postalCode).toBe('10200')
  })

  it('handles an up-country province with อำเภอ rather than เขต', () => {
    const districts = districtsFor('เชียงใหม่')
    expect(districts.length).toBeGreaterThan(20)

    const muang = districts.find((d) => d.name === 'เมืองเชียงใหม่')
    expect(muang).toBeDefined()
    expect(muang!.subDistricts.length).toBeGreaterThan(0)
  })

  it('does not confuse provinces that share a prefix', () => {
    const names = districtsFor('นครปฐม').map((d) => d.name)
    expect(names).toContain('เมืองนครปฐม')
    expect(names).not.toContain('เมืองนครราชสีมา')
  })

  it('sorts districts and sub-districts for a reader, not by id', () => {
    const collator = new Intl.Collator('th')
    const districts = districtsFor('ภูเก็ต')

    const names = districts.map((d) => d.name)
    expect(names).toEqual([...names].sort((a, b) => collator.compare(a, b)))

    for (const district of districts) {
      const subs = district.subDistricts.map((s) => s.name)
      expect(subs).toEqual([...subs].sort((a, b) => collator.compare(a, b)))
    }
  })

  it('gives every postal code as five digits', () => {
    for (const province of provinces()) {
      for (const district of districtsFor(province.name)) {
        for (const sub of district.subDistricts) {
          expect(sub.postalCode).toMatch(/^\d{5}$/)
        }
      }
    }
  })

  it('carries an English name on every district and sub-district', () => {
    // The whole reason this dataset was chosen over the npm one.
    for (const district of districtsFor('ภูเก็ต')) {
      expect(district.nameEn.length).toBeGreaterThan(0)
      for (const sub of district.subDistricts) {
        expect(sub.nameEn.length).toBeGreaterThan(0)
      }
    }
  })

  it('covers the whole country', () => {
    let districts = 0
    let subs = 0
    for (const province of provinces()) {
      for (const district of districtsFor(province.name)) {
        districts += 1
        subs += district.subDistricts.length
      }
    }
    // Official figures are ~928 districts and ~7,255 sub-districts; the
    // upstream splits a few more finely. A sharp drop means a broken generate.
    expect(districts).toBeGreaterThanOrEqual(920)
    expect(subs).toBeGreaterThanOrEqual(7200)
  })
})
