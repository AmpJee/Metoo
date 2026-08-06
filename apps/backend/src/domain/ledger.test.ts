import { describe, expect, test } from 'bun:test'
import {
  MIN_WITHDRAWAL_MINOR,
  checkWithdrawal,
  computeBalance,
  pendingClearance,
  settlementEntries,
} from './ledger.ts'

describe('settlementEntries', () => {
  const order = { subtotalMinor: 108_000, commissionMinor: 4_320 }

  test('writes the sale and the fee as separate rows', () => {
    // The wallet screen lists "Payout · Order X" and "Platform fee" as two
    // lines, and a brand querying its commission needs to see the gross.
    expect(settlementEntries(order)).toEqual([
      { type: 'SALE_CREDIT', amountMinor: 108_000 },
      { type: 'COMMISSION_DEBIT', amountMinor: -4_320 },
    ])
  })

  test('the fee is negative so the balance is a plain sum', () => {
    const entries = settlementEntries(order)
    expect(entries[1]!.amountMinor).toBeLessThan(0)
  })

  test('the entries net to the payout the order promised', () => {
    // subtotal - commission is exactly payoutMinor on the order, so the wallet
    // and the order can never disagree about what the brand earned.
    expect(computeBalance(settlementEntries(order))).toBe(108_000 - 4_320)
  })

  test('a zero-commission order still writes both rows', () => {
    const entries = settlementEntries({
      subtotalMinor: 5_000,
      commissionMinor: 0,
    })
    expect(entries).toHaveLength(2)
    expect(computeBalance(entries)).toBe(5_000)
  })
})

describe('computeBalance', () => {
  test('an empty ledger is zero, not an error', () => {
    expect(computeBalance([])).toBe(0)
  })

  test('sums credits and debits without branching on type', () => {
    const balance = computeBalance([
      { type: 'SALE_CREDIT', amountMinor: 100_000 },
      { type: 'COMMISSION_DEBIT', amountMinor: -5_000 },
      { type: 'SALE_CREDIT', amountMinor: 50_000 },
      { type: 'COMMISSION_DEBIT', amountMinor: -2_500 },
      { type: 'WITHDRAWAL_DEBIT', amountMinor: -100_000 },
    ])
    expect(balance).toBe(42_500)
  })

  test('a refund reduces the balance', () => {
    const balance = computeBalance([
      { type: 'SALE_CREDIT', amountMinor: 20_000 },
      { type: 'REFUND_DEBIT', amountMinor: -20_000 },
    ])
    expect(balance).toBe(0)
  })

  test('an ADJUSTMENT can correct in either direction', () => {
    // Corrections are compensating entries, never edits to existing rows.
    expect(
      computeBalance([
        { type: 'SALE_CREDIT', amountMinor: 10_000 },
        { type: 'ADJUSTMENT', amountMinor: -1_000 },
        { type: 'ADJUSTMENT', amountMinor: 500 },
      ])
    ).toBe(9_500)
  })

  test('withdrawing everything leaves exactly zero', () => {
    expect(
      computeBalance([
        { type: 'SALE_CREDIT', amountMinor: 75_000 },
        { type: 'WITHDRAWAL_DEBIT', amountMinor: -75_000 },
      ])
    ).toBe(0)
  })
})

describe('checkWithdrawal', () => {
  test('accepts an amount within the balance', () => {
    expect(checkWithdrawal(50_000, 100_000)).toEqual({ ok: true })
  })

  test('accepts the whole balance', () => {
    // The boundary must pass, or a brand can never fully cash out.
    expect(checkWithdrawal(100_000, 100_000)).toEqual({ ok: true })
  })

  test('rejects one satang over the balance', () => {
    expect(checkWithdrawal(100_001, 100_000)).toMatchObject({
      ok: false,
      code: 'INSUFFICIENT_BALANCE',
    })
  })

  test('rejects withdrawing against an empty wallet', () => {
    expect(checkWithdrawal(MIN_WITHDRAWAL_MINOR, 0)).toMatchObject({
      ok: false,
      code: 'INSUFFICIENT_BALANCE',
    })
  })

  test('rejects amounts below the minimum', () => {
    expect(checkWithdrawal(MIN_WITHDRAWAL_MINOR - 1, 999_999)).toMatchObject({
      ok: false,
      code: 'BELOW_MINIMUM',
    })
  })

  test('accepts exactly the minimum', () => {
    expect(checkWithdrawal(MIN_WITHDRAWAL_MINOR, 999_999)).toEqual({ ok: true })
  })

  test('rejects zero, negatives and fractions', () => {
    for (const bad of [0, -5_000, 1.5]) {
      expect(checkWithdrawal(bad, 999_999)).toMatchObject({
        ok: false,
        code: 'INVALID_AMOUNT',
      })
    }
  })

  test('a negative balance cannot be withdrawn against', () => {
    // Should not arise, but an overdrawn wallet must not hand out more money.
    expect(checkWithdrawal(MIN_WITHDRAWAL_MINOR, -5_000)).toMatchObject({
      ok: false,
      code: 'INSUFFICIENT_BALANCE',
    })
  })

  test('the message names the available balance', () => {
    const result = checkWithdrawal(200_000, 123_45)
    if (result.ok) throw new Error('expected failure')
    expect(result.message).toContain('123.45')
  })
})

describe('pendingClearance', () => {
  test('sums the payout of delivered but unsettled orders', () => {
    expect(
      pendingClearance([{ payoutMinor: 20_000 }, { payoutMinor: 22_600 }])
    ).toBe(42_600)
  })

  test('nothing delivered means nothing pending', () => {
    expect(pendingClearance([])).toBe(0)
  })

  test('uses payout, not subtotal — commission is never pending', () => {
    // What clears is what the brand actually earns, after the platform fee.
    expect(pendingClearance([{ payoutMinor: 95_000 }])).toBe(95_000)
  })
})
