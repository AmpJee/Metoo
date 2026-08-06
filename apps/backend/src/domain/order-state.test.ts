import { describe, expect, test } from 'bun:test'
import { ORDER_STATUSES } from '@metoo/shared'
import type { OrderStatus } from '@metoo/shared'
import type { Actor } from './order-state.ts'
import {
  COUNTS_TOWARD_VOLUME,
  EARNS_REVENUE,
  TIMESTAMP_FIELD,
  availableTransitions,
  canTransition,
  isFinal,
} from './order-state.ts'

/**
 * The six steps, each with the actor who owns that move.
 *
 * No single role can walk this alone, and that is the point: the brand
 * accepts, admin runs logistics, the retailer confirms receipt.
 */
const HAPPY_PATH: Array<{ from: OrderStatus; to: OrderStatus; by: Actor }> = [
  { from: 'PENDING', to: 'CONFIRMED', by: 'BRAND' },
  { from: 'CONFIRMED', to: 'READY_FOR_PICKUP', by: 'ADMIN' },
  { from: 'READY_FOR_PICKUP', to: 'PICKED_UP', by: 'ADMIN' },
  { from: 'PICKED_UP', to: 'DELIVERED', by: 'ADMIN' },
  { from: 'DELIVERED', to: 'SETTLED', by: 'RETAILER' },
]

describe('canTransition — the happy path', () => {
  test('each step is allowed for the actor that owns it', () => {
    for (const { from, to, by } of HAPPY_PATH) {
      expect(canTransition(from, to, by)).toEqual({ ok: true })
    }
  })

  test('an admin can make every move', () => {
    // Admin is the override on every step, including the two it does not own.
    for (const { from, to } of HAPPY_PATH) {
      expect(canTransition(from, to, 'ADMIN')).toEqual({ ok: true })
    }
  })

  test('there is no PREPARING step', () => {
    expect(ORDER_STATUSES).not.toContain('PREPARING' as OrderStatus)
    expect(canTransition('CONFIRMED', 'READY_FOR_PICKUP', 'ADMIN')).toEqual({
      ok: true,
    })
  })
})

describe('who may move an order', () => {
  test('only the brand accepts an order', () => {
    expect(availableTransitions('PENDING', 'BRAND')).toContainEqual({
      to: 'CONFIRMED',
      label: 'Confirm Order',
    })
    expect(canTransition('PENDING', 'CONFIRMED', 'RETAILER')).toMatchObject({
      ok: false,
      code: 'FORBIDDEN_TRANSITION',
    })
  })

  test('a brand cannot drive logistics', () => {
    // A seller must not be able to claim their own parcel was collected or
    // delivered — that is admin's to record.
    for (const { from, to } of HAPPY_PATH.slice(1, 4)) {
      expect(canTransition(from, to, 'BRAND')).toMatchObject({
        ok: false,
        code: 'FORBIDDEN_TRANSITION',
      })
    }
    expect(availableTransitions('READY_FOR_PICKUP', 'BRAND')).toEqual([])
  })

  test('a brand cannot settle its own order', () => {
    // This is the one that guards the money: settling writes the wallet
    // credit, so a seller doing it would be crediting themselves.
    expect(canTransition('DELIVERED', 'SETTLED', 'BRAND')).toMatchObject({
      ok: false,
      code: 'FORBIDDEN_TRANSITION',
    })
    expect(availableTransitions('DELIVERED', 'BRAND')).toEqual([])
  })

  test('the retailer confirms delivery, and admin can too', () => {
    const label = 'Confirm Delivered'
    expect(availableTransitions('DELIVERED', 'RETAILER')).toEqual([
      { to: 'SETTLED', label },
    ])
    expect(availableTransitions('DELIVERED', 'ADMIN')).toEqual([
      { to: 'SETTLED', label },
    ])
  })

  test('confirming delivery is the retailer’s only move', () => {
    // The retailer is not a general operator of the machine.
    for (const status of ORDER_STATUSES) {
      if (status === 'DELIVERED') continue
      expect(availableTransitions(status, 'RETAILER')).toEqual([])
    }
  })
})

describe('canTransition — illegal moves', () => {
  test('steps cannot be skipped', () => {
    const result = canTransition('CONFIRMED', 'DELIVERED', 'ADMIN')
    expect(result).toMatchObject({ ok: false, code: 'ILLEGAL_TRANSITION' })
  })

  test('an order cannot go backwards', () => {
    expect(canTransition('DELIVERED', 'CONFIRMED', 'ADMIN')).toMatchObject({
      ok: false,
      code: 'ILLEGAL_TRANSITION',
    })
  })

  test('the error names what may come next', () => {
    const result = canTransition('CONFIRMED', 'SETTLED', 'ADMIN')
    if (result.ok) throw new Error('expected failure')
    expect(result.message).toContain('READY_FOR_PICKUP')
  })

  test('moving to the state it is already in is rejected', () => {
    expect(canTransition('CONFIRMED', 'CONFIRMED', 'ADMIN')).toMatchObject({
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
    for (const status of ['PENDING', 'CONFIRMED'] as const) {
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

  test('a retailer cannot cancel', () => {
    expect(canTransition('PENDING', 'CANCELLED', 'RETAILER')).toMatchObject({
      ok: false,
      code: 'FORBIDDEN_TRANSITION',
    })
  })
})

describe('revenue status sets', () => {
  test('an unaccepted or cancelled order is not revenue', () => {
    expect(EARNS_REVENUE).not.toContain('PENDING')
    expect(EARNS_REVENUE).not.toContain('CANCELLED')
  })

  test('every state from CONFIRMED onward earns revenue', () => {
    for (const status of [
      'CONFIRMED',
      'READY_FOR_PICKUP',
      'PICKED_UP',
      'DELIVERED',
      'SETTLED',
    ] as const) {
      expect(EARNS_REVENUE).toContain(status)
    }
  })

  test('volume excludes CLOSED but is otherwise identical to revenue', () => {
    expect(COUNTS_TOWARD_VOLUME).not.toContain('CLOSED')
    expect([...COUNTS_TOWARD_VOLUME].sort()).toEqual(
      EARNS_REVENUE.filter((s) => s !== 'CLOSED').sort()
    )
  })

  test('a new order status must be classified deliberately', () => {
    const classified = new Set<string>([
      ...EARNS_REVENUE,
      'PENDING',
      'CANCELLED',
    ])
    for (const status of ORDER_STATUSES) {
      expect(classified.has(status)).toBe(true)
    }
  })
})

describe('TIMESTAMP_FIELD', () => {
  test('every step past PENDING stamps a column', () => {
    for (const { to } of HAPPY_PATH) {
      expect(TIMESTAMP_FIELD[to]).toBeTruthy()
    }
  })

  test('the columns match the schema field names', () => {
    expect(TIMESTAMP_FIELD.READY_FOR_PICKUP).toBe('readyForPickupAt')
    expect(TIMESTAMP_FIELD.SETTLED).toBe('settledAt')
  })
})
