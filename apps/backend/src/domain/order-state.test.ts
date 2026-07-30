import { describe, expect, test } from 'bun:test'
import { ORDER_STATUSES } from '@metoo/shared'
import type { OrderStatus } from '@metoo/shared'
import {
  TIMESTAMP_FIELD,
  availableTransitions,
  canTransition,
  isFinal,
} from './order-state.ts'

/** The happy path the seller's tracker walks, in order. */
const HAPPY_PATH: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERED',
  'SETTLED',
]

describe('canTransition — the happy path', () => {
  test('a brand can walk an order through all seven steps', () => {
    for (let i = 0; i < HAPPY_PATH.length - 1; i++) {
      const from = HAPPY_PATH[i]!
      const to = HAPPY_PATH[i + 1]!
      expect(canTransition(from, to, 'BRAND')).toEqual({ ok: true })
    }
  })

  test('an admin can make every move a brand can', () => {
    for (let i = 0; i < HAPPY_PATH.length - 1; i++) {
      expect(
        canTransition(HAPPY_PATH[i]!, HAPPY_PATH[i + 1]!, 'ADMIN')
      ).toEqual({ ok: true })
    }
  })

  test('the seller presses Confirm Money Received', () => {
    // The design puts this button on the seller's own order card.
    const moves = availableTransitions('DELIVERED', 'BRAND')
    expect(moves).toEqual([{ to: 'SETTLED', label: 'Confirm Money Received' }])
  })
})

describe('canTransition — illegal moves', () => {
  test('steps cannot be skipped', () => {
    // Straight from Confirmed to Delivered would bypass packing and pickup.
    const result = canTransition('CONFIRMED', 'DELIVERED', 'BRAND')
    expect(result).toMatchObject({ ok: false, code: 'ILLEGAL_TRANSITION' })
  })

  test('an order cannot go backwards', () => {
    expect(canTransition('DELIVERED', 'PREPARING', 'BRAND')).toMatchObject({
      ok: false,
      code: 'ILLEGAL_TRANSITION',
    })
  })

  test('the error names what may come next', () => {
    const result = canTransition('PREPARING', 'SETTLED', 'BRAND')
    if (result.ok) throw new Error('expected failure')
    expect(result.message).toContain('READY_FOR_PICKUP')
  })

  test('moving to the state it is already in is rejected', () => {
    expect(canTransition('CONFIRMED', 'CONFIRMED', 'BRAND')).toMatchObject({
      ok: false,
      code: 'ORDER_ALREADY_IN_STATE',
    })
  })
})

describe('final states', () => {
  test('SETTLED, CANCELLED and CLOSED are final', () => {
    for (const status of ['SETTLED', 'CANCELLED', 'CLOSED'] as const) {
      expect(isFinal(status)).toBe(true)
      expect(availableTransitions(status, 'ADMIN')).toEqual([])
    }
  })

  test('a settled order cannot be reopened, even by an admin', () => {
    // Its wallet ledger rows are append-only; reopening would mean unwinding
    // money that has already been credited.
    expect(canTransition('SETTLED', 'DELIVERED', 'ADMIN')).toMatchObject({
      ok: false,
      code: 'ORDER_FINAL',
    })
  })

  test('every non-final state has somewhere to go', () => {
    for (const status of ORDER_STATUSES) {
      if (isFinal(status)) continue
      expect(availableTransitions(status, 'ADMIN').length).toBeGreaterThan(0)
    }
  })
})

describe('cancellation', () => {
  test('an order can be cancelled before it is collected', () => {
    for (const status of ['PENDING', 'CONFIRMED', 'PREPARING'] as const) {
      expect(canTransition(status, 'CANCELLED', 'BRAND')).toEqual({ ok: true })
    }
  })

  test('an order cannot be cancelled once a courier has it', () => {
    // Goods already in transit come back as a return, not a cancellation.
    for (const status of [
      'READY_FOR_PICKUP',
      'PICKED_UP',
      'DELIVERED',
    ] as const) {
      expect(canTransition(status, 'CANCELLED', 'ADMIN')).toMatchObject({
        ok: false,
      })
    }
  })
})

describe('TIMESTAMP_FIELD', () => {
  test('every step past PENDING stamps a column', () => {
    for (const status of HAPPY_PATH.slice(1)) {
      // PREPARING is the one step with no column — packing has no meaningful
      // moment to record beyond the audit log.
      if (status === 'PREPARING') continue
      expect(TIMESTAMP_FIELD[status]).toBeTruthy()
    }
  })

  test('the columns match the schema field names', () => {
    expect(TIMESTAMP_FIELD.READY_FOR_PICKUP).toBe('readyForPickupAt')
    expect(TIMESTAMP_FIELD.SETTLED).toBe('settledAt')
  })
})
