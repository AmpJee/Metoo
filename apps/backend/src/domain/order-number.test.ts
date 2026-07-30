import { describe, expect, test } from 'bun:test'
import { generateOrderNumber, isOrderNumber } from './order-number.ts'

describe('generateOrderNumber', () => {
  test('matches the documented format', () => {
    expect(isOrderNumber(generateOrderNumber())).toBe(true)
  })

  test('embeds the UTC date of the order', () => {
    const number = generateOrderNumber(new Date('2026-07-30T12:00:00Z'))
    expect(number.startsWith('MT-260730-')).toBe(true)
  })

  test('pads single-digit months and days', () => {
    const number = generateOrderNumber(new Date('2026-01-05T00:00:00Z'))
    expect(number.startsWith('MT-260105-')).toBe(true)
  })

  test('uses UTC, not local time', () => {
    // Late-evening UTC must not roll into the next day just because the server
    // happens to sit in a positive offset — the reference has to mean the same
    // day to support staff in Bangkok and to a log in another region.
    const number = generateOrderNumber(new Date('2026-07-30T23:59:59Z'))
    expect(number.startsWith('MT-260730-')).toBe(true)
  })

  test('is not sequential — two orders on the same day differ', () => {
    const a = generateOrderNumber(new Date('2026-07-30T12:00:00Z'))
    const b = generateOrderNumber(new Date('2026-07-30T12:00:00Z'))
    expect(a).not.toBe(b)
  })

  test('omits the characters people misread', () => {
    // I, L, O and U are excluded so a reference read aloud or retyped does not
    // become a different valid-looking one.
    const suffixes = Array.from(
      { length: 300 },
      () => generateOrderNumber().split('-')[2]!
    ).join('')

    for (const forbidden of ['I', 'L', 'O', 'U']) {
      expect(suffixes).not.toContain(forbidden)
    }
  })

  test('generates distinct references across many calls', () => {
    // Not a guarantee of uniqueness — the database unique constraint is that.
    // This catches a generator that is accidentally deterministic.
    const count = 2_000
    const seen = new Set(
      Array.from({ length: count }, () => generateOrderNumber())
    )
    expect(seen.size).toBe(count)
  })
})

describe('isOrderNumber', () => {
  test('rejects malformed references', () => {
    for (const bad of [
      '',
      'MT-260730',
      'MT-260730-ABC',
      'MT-26073-ABCDEF',
      'XX-260730-ABCDEF',
      'MT-260730-abcdef', // lower case
      'MT-260730-ABCDEI', // excluded letter
      'MT-260730-ABCDEFG', // too long
    ]) {
      expect(isOrderNumber(bad)).toBe(false)
    }
  })
})
