import { describe, expect, test } from 'bun:test'
import { ORDER_STATUSES } from '@metoo/shared'
import { computeBalance } from './ledger.ts'
import {
  canRequestReturn,
  canReviewReturn,
  refundEntries,
  statusAfterReview,
} from './returns.ts'

describe('canRequestReturn', () => {
  test('allowed once the goods have been received', () => {
    for (const status of ['DELIVERED', 'SETTLED'] as const) {
      expect(canRequestReturn(status, false)).toEqual({ ok: true })
    }
  })

  test('blocked at every stage before delivery', () => {
    // A retailer cannot return what they have not received.
    for (const status of [
      'PENDING',
      'CONFIRMED',
      'READY_FOR_PICKUP',
      'PICKED_UP',
    ] as const) {
      expect(canRequestReturn(status, false)).toMatchObject({
        ok: false,
        code: 'RETURN_BEFORE_DELIVERY',
      })
    }
  })

  test('a cancelled or closed order says so plainly', () => {
    for (const status of ['CANCELLED', 'CLOSED'] as const) {
      const result = canRequestReturn(status, false)
      if (result.ok) throw new Error('expected failure')
      expect(result.message).toContain('closed')
    }
  })

  test('only one return per order', () => {
    expect(canRequestReturn('DELIVERED', true)).toMatchObject({
      ok: false,
      code: 'RETURN_ALREADY_REQUESTED',
    })
  })

  test('the duplicate check runs before the status check', () => {
    // Otherwise a second request against a closed order would report the
    // wrong reason.
    expect(canRequestReturn('CLOSED', true)).toMatchObject({
      code: 'RETURN_ALREADY_REQUESTED',
    })
  })

  test('every order status is handled', () => {
    for (const status of ORDER_STATUSES) {
      expect(() => canRequestReturn(status, false)).not.toThrow()
    }
  })
})

describe('canReviewReturn', () => {
  test('an open request can be decided', () => {
    expect(canReviewReturn('REQUESTED')).toEqual({ ok: true })
  })

  test('a decided request cannot be decided again', () => {
    for (const status of ['ACCEPTED', 'REJECTED'] as const) {
      expect(canReviewReturn(status)).toMatchObject({
        ok: false,
        code: 'RETURN_ALREADY_REVIEWED',
      })
    }
  })
})

describe('refundEntries', () => {
  test('a settled order gives back exactly what the brand received', () => {
    // Not the order total: the platform's commission is its own to refund or
    // absorb and does not belong in the brand's ledger.
    const entries = refundEntries({ status: 'SETTLED', payoutMinor: 103_680 })
    expect(entries).toEqual([{ type: 'REFUND_DEBIT', amountMinor: -103_680 }])
  })

  test('a delivered but unsettled order writes nothing', () => {
    // It was never credited, so there is nothing to unwind. Writing a debit
    // would push the balance negative for money the brand never had.
    expect(
      refundEntries({ status: 'DELIVERED', payoutMinor: 103_680 })
    ).toEqual([])
  })

  test('accepting a return on a settled order returns the wallet to zero', () => {
    const settlement = [
      { type: 'SALE_CREDIT' as const, amountMinor: 108_000 },
      { type: 'COMMISSION_DEBIT' as const, amountMinor: -4_320 },
    ]
    const refund = refundEntries({ status: 'SETTLED', payoutMinor: 103_680 })

    expect(computeBalance([...settlement, ...refund])).toBe(0)
  })

  test('the debit is negative so the balance stays a plain sum', () => {
    const [entry] = refundEntries({ status: 'SETTLED', payoutMinor: 5_000 })
    expect(entry!.amountMinor).toBeLessThan(0)
  })
})

describe('statusAfterReview', () => {
  test('accepting closes the order', () => {
    expect(statusAfterReview('SETTLED', 'ACCEPTED')).toBe('CLOSED')
    expect(statusAfterReview('DELIVERED', 'ACCEPTED')).toBe('CLOSED')
  })

  test('rejecting leaves the order exactly where it was', () => {
    // "Stays closed as delivered" means the delivery stands, not that the
    // order moves somewhere new.
    expect(statusAfterReview('DELIVERED', 'REJECTED')).toBe('DELIVERED')
    expect(statusAfterReview('SETTLED', 'REJECTED')).toBe('SETTLED')
  })
})
