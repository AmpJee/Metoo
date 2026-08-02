import { describe, expect, test } from 'bun:test'
import { accountLast4 } from './bank.ts'

describe('accountLast4', () => {
  test('takes the last four digits, not the last four characters', () => {
    // The bug this exists to prevent: "123-4-56789-0".slice(-4) is "89-0".
    expect(accountLast4('123-4-56789-0')).toBe('7890')
  })

  test('handles the separators Thai accounts are written with', () => {
    expect(accountLast4('1234567890')).toBe('7890')
    expect(accountLast4('123 456 7890')).toBe('7890')
    expect(accountLast4('123-456-7890')).toBe('7890')
    expect(accountLast4('  1234567890  ')).toBe('7890')
  })

  test('is null when nothing is on file', () => {
    expect(accountLast4(null)).toBeNull()
    expect(accountLast4(undefined)).toBeNull()
    expect(accountLast4('')).toBeNull()
  })

  test('is null rather than a partial mask when there are too few digits', () => {
    // "•••• 90" would read as "an account is configured" when none usably is.
    expect(accountLast4('90')).toBeNull()
    expect(accountLast4('---')).toBeNull()
    expect(accountLast4('123')).toBeNull()
  })

  test('four digits is the boundary and is included', () => {
    expect(accountLast4('4821')).toBe('4821')
  })
})
