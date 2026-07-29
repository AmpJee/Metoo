import { describe, expect, test } from 'bun:test'
import { checkQuantity, groupByBrand, lineTotalMinor } from './cart.ts'

describe('checkQuantity', () => {
  const rules = { moq: 12, caseSize: 6 }

  test('accepts a quantity exactly at the minimum', () => {
    // The boundary itself must pass — an off-by-one here would silently make
    // the advertised MOQ unreachable.
    expect(checkQuantity(12, rules)).toEqual({ ok: true })
  })

  test('rejects one unit below the minimum', () => {
    const result = checkQuantity(6, rules)
    expect(result.ok).toBe(false)
    expect(result).toMatchObject({ code: 'BELOW_MOQ' })
  })

  test('accepts exact case multiples above the minimum', () => {
    expect(checkQuantity(18, rules)).toEqual({ ok: true })
    expect(checkQuantity(24, rules)).toEqual({ ok: true })
  })

  test('rejects a non-multiple of the case size', () => {
    const result = checkQuantity(13, rules)
    expect(result.ok).toBe(false)
    expect(result).toMatchObject({ code: 'NOT_CASE_MULTIPLE' })
  })

  test('suggests the next valid quantity when the case size is wrong', () => {
    const result = checkQuantity(13, rules)
    if (result.ok) throw new Error('expected failure')
    // 13 rounds up to 18, not down to 12 — rounding down would drop below the
    // quantity the retailer asked for.
    expect(result.message).toContain('18')
  })

  test('the default rules accept any positive quantity', () => {
    // moq 1 / caseSize 1 is the schema default, so a brand that sets neither
    // must not accidentally constrain its buyers.
    const defaults = { moq: 1, caseSize: 1 }
    expect(checkQuantity(1, defaults)).toEqual({ ok: true })
    expect(checkQuantity(7, defaults)).toEqual({ ok: true })
    expect(checkQuantity(9999, defaults)).toEqual({ ok: true })
  })

  test('rejects zero, negatives and fractions', () => {
    for (const bad of [0, -5, 2.5]) {
      const result = checkQuantity(bad, { moq: 1, caseSize: 1 })
      expect(result).toMatchObject({ ok: false, code: 'INVALID_QUANTITY' })
    }
  })

  test('MOQ is checked before case size', () => {
    // 6 fails both rules; the more useful message is the minimum, since
    // meeting it is the bigger jump.
    const result = checkQuantity(6, { moq: 12, caseSize: 6 })
    expect(result).toMatchObject({ code: 'BELOW_MOQ' })
  })
})

describe('lineTotalMinor', () => {
  test('multiplies unit price by quantity in satang', () => {
    // 45.00 THB x 12 = 540.00 THB
    expect(
      lineTotalMinor({ brandId: 'b1', unitPriceMinor: 4500, quantity: 12 })
    ).toBe(54_000)
  })

  test('stays exact on prices that would round badly as floats', () => {
    // 0.07 * 3 is 0.21000000000000002 in float arithmetic. Integer satang
    // makes that class of bug impossible, which is why money is stored this way.
    expect(
      lineTotalMinor({ brandId: 'b1', unitPriceMinor: 7, quantity: 3 })
    ).toBe(21)
  })
})

describe('groupByBrand', () => {
  const items = [
    { brandId: 'brand-a', unitPriceMinor: 1000, quantity: 2 },
    { brandId: 'brand-b', unitPriceMinor: 500, quantity: 4 },
    { brandId: 'brand-a', unitPriceMinor: 250, quantity: 8 },
  ]

  test('splits a multi-brand cart into one group per brand', () => {
    const groups = groupByBrand(items)
    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.brandId).sort()).toEqual(['brand-a', 'brand-b'])
  })

  test('subtotals each brand independently', () => {
    const groups = groupByBrand(items)
    const a = groups.find((g) => g.brandId === 'brand-a')
    const b = groups.find((g) => g.brandId === 'brand-b')

    expect(a?.subtotalMinor).toBe(1000 * 2 + 250 * 8) // 4000
    expect(b?.subtotalMinor).toBe(500 * 4) // 2000
  })

  test('keeps every line — nothing is dropped in grouping', () => {
    const groups = groupByBrand(items)
    const total = groups.reduce((n, g) => n + g.items.length, 0)
    expect(total).toBe(items.length)
  })

  test('a single-brand cart yields exactly one group', () => {
    const groups = groupByBrand([items[0]!])
    expect(groups).toHaveLength(1)
  })

  test('an empty cart yields no groups', () => {
    expect(groupByBrand([])).toEqual([])
  })
})
