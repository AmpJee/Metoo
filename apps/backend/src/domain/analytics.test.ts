import { describe, expect, test } from 'bun:test'
import type { OrderFact } from './analytics.ts'
import {
  averageDaysToFirstOrder,
  averageFulfilmentHours,
  averageOrderValue,
  bucketByDay,
  bucketByMonth,
  contributionMarginMinor,
  periodStart,
  repeatOrderRate,
} from './analytics.ts'

const NOW = new Date('2026-07-30T12:00:00Z')

function order(overrides: Partial<OrderFact> = {}): OrderFact {
  return {
    createdAt: NOW,
    subtotalMinor: 100_000,
    commissionMinor: 5_000,
    deliveryCostMinor: 0,
    retailerId: 'r1',
    deliveredAt: null,
    ...overrides,
  }
}

describe('periodStart', () => {
  test('covers the right span for each toggle option', () => {
    expect(periodStart('day', NOW).toISOString()).toBe(
      '2026-07-29T12:00:00.000Z'
    )
    expect(periodStart('week', NOW).toISOString()).toBe(
      '2026-07-23T12:00:00.000Z'
    )
    expect(periodStart('month', NOW).toISOString()).toBe(
      '2026-06-30T12:00:00.000Z'
    )
  })
})

describe('averageOrderValue', () => {
  test('divides total by count', () => {
    const avg = averageOrderValue([
      order({ subtotalMinor: 100_000 }),
      order({ subtotalMinor: 200_000 }),
    ])
    expect(avg).toBe(150_000)
  })

  test('floors rather than inventing fractional satang', () => {
    // 100 / 3 = 33.33 satang, which does not exist as money.
    const avg = averageOrderValue([
      order({ subtotalMinor: 100 }),
      order({ subtotalMinor: 100 }),
      order({ subtotalMinor: 101 }),
    ])
    expect(avg).toBe(100)
    expect(Number.isInteger(avg)).toBe(true)
  })

  test('no orders is zero, not a division by zero', () => {
    expect(averageOrderValue([])).toBe(0)
  })
})

describe('repeatOrderRate', () => {
  test("a retailer's first order is never a repeat", () => {
    const result = repeatOrderRate([order({ retailerId: 'a' })])
    expect(result).toEqual({ repeatOrders: 0, totalOrders: 1, percent: 0 })
  })

  test('every order after the first from a retailer is a repeat', () => {
    const result = repeatOrderRate([
      order({ retailerId: 'a' }),
      order({ retailerId: 'a' }),
      order({ retailerId: 'a' }),
    ])
    expect(result.repeatOrders).toBe(2)
    expect(result.percent).toBe(67)
  })

  test('counts orders, not retailers', () => {
    // Two retailers, four orders: two of them are repeats. Counting retailers
    // would give 100%, which is a different and less useful number.
    const result = repeatOrderRate([
      order({ retailerId: 'a' }),
      order({ retailerId: 'b' }),
      order({ retailerId: 'a' }),
      order({ retailerId: 'b' }),
    ])
    expect(result).toEqual({ repeatOrders: 2, totalOrders: 4, percent: 50 })
  })

  test('all-new retailers give zero percent', () => {
    const result = repeatOrderRate([
      order({ retailerId: 'a' }),
      order({ retailerId: 'b' }),
    ])
    expect(result.percent).toBe(0)
  })

  test('an empty period is zero, not NaN', () => {
    expect(repeatOrderRate([])).toEqual({
      repeatOrders: 0,
      totalOrders: 0,
      percent: 0,
    })
  })
})

describe('contributionMarginMinor', () => {
  test('commission minus logistics', () => {
    const margin = contributionMarginMinor([
      order({ commissionMinor: 6_100, deliveryCostMinor: 2_760 }),
    ])
    expect(margin).toBe(3_340)
  })

  test('subtracts gateway fees when there are any', () => {
    // No gateway yet, so this term is zero by default — but the design's
    // formula includes it, and it should not need re-deriving later.
    const orders = [order({ commissionMinor: 6_100, deliveryCostMinor: 2_760 })]
    expect(contributionMarginMinor(orders, 1_240)).toBe(2_100)
  })

  test('can go negative when logistics exceed commission', () => {
    // Worth surfacing rather than clamping: a route that loses money should
    // look like it loses money.
    expect(
      contributionMarginMinor([
        order({ commissionMinor: 1_000, deliveryCostMinor: 3_000 }),
      ])
    ).toBe(-2_000)
  })

  test('no orders is zero', () => {
    expect(contributionMarginMinor([])).toBe(0)
  })
})

describe('averageFulfilmentHours', () => {
  test('averages placed-to-delivered across delivered orders', () => {
    const hours = averageFulfilmentHours([
      order({
        createdAt: new Date('2026-07-29T00:00:00Z'),
        deliveredAt: new Date('2026-07-30T04:00:00Z'), // 28h
      }),
      order({
        createdAt: new Date('2026-07-29T00:00:00Z'),
        deliveredAt: new Date('2026-07-29T22:00:00Z'), // 22h
      }),
    ])
    expect(hours).toBe(25)
  })

  test('undelivered orders are excluded, not counted as zero', () => {
    // Including them would drag the average down every time a new order
    // arrives, which is the opposite of what the metric is for.
    const hours = averageFulfilmentHours([
      order({
        createdAt: new Date('2026-07-29T00:00:00Z'),
        deliveredAt: new Date('2026-07-30T04:00:00Z'),
      }),
      order({ deliveredAt: null }),
    ])
    expect(hours).toBe(28)
  })

  test('nothing delivered yet is null, not zero', () => {
    // Zero hours would read as instant fulfilment.
    expect(averageFulfilmentHours([order({ deliveredAt: null })])).toBeNull()
  })
})

describe('bucketByDay', () => {
  test('includes days with no orders', () => {
    // A chart that omits an empty day shows a short week and reads as a good
    // one rather than a missing day.
    const buckets = bucketByDay(
      [order({ createdAt: new Date('2026-07-28T10:00:00Z') })],
      new Date('2026-07-27T00:00:00Z'),
      new Date('2026-07-29T00:00:00Z')
    )
    expect(buckets.map((b) => b.date)).toEqual([
      '2026-07-27',
      '2026-07-28',
      '2026-07-29',
    ])
    expect(buckets[0]!.count).toBe(0)
    expect(buckets[1]!.count).toBe(1)
  })

  test('sums value and counts per day', () => {
    const buckets = bucketByDay(
      [
        order({
          createdAt: new Date('2026-07-28T09:00:00Z'),
          subtotalMinor: 10_000,
        }),
        order({
          createdAt: new Date('2026-07-28T18:00:00Z'),
          subtotalMinor: 5_000,
        }),
      ],
      new Date('2026-07-28T00:00:00Z'),
      new Date('2026-07-28T23:59:59Z')
    )
    expect(buckets).toEqual([
      { date: '2026-07-28', valueMinor: 15_000, count: 2 },
    ])
  })

  test('orders outside the window are ignored', () => {
    const buckets = bucketByDay(
      [order({ createdAt: new Date('2026-01-01T00:00:00Z') })],
      new Date('2026-07-28T00:00:00Z'),
      new Date('2026-07-28T23:59:59Z')
    )
    expect(buckets[0]!.count).toBe(0)
  })
})

describe('averageDaysToFirstOrder', () => {
  test('averages signup to first order', () => {
    const days = averageDaysToFirstOrder([
      {
        createdAt: new Date('2026-07-01T00:00:00Z'),
        firstOrderAt: new Date('2026-07-07T00:00:00Z'), // 6d
      },
      {
        createdAt: new Date('2026-07-01T00:00:00Z'),
        firstOrderAt: new Date('2026-07-13T00:00:00Z'), // 12d
      },
    ])
    expect(days).toBe(9)
  })

  test('retailers who never ordered are excluded', () => {
    // They have no elapsed time to measure; counting them as zero would
    // flatter the number.
    const days = averageDaysToFirstOrder([
      {
        createdAt: new Date('2026-07-01T00:00:00Z'),
        firstOrderAt: new Date('2026-07-11T00:00:00Z'),
      },
      { createdAt: new Date('2026-07-01T00:00:00Z'), firstOrderAt: null },
    ])
    expect(days).toBe(10)
  })

  test('nobody converted yet is null', () => {
    expect(
      averageDaysToFirstOrder([
        { createdAt: new Date('2026-07-01T00:00:00Z'), firstOrderAt: null },
      ])
    ).toBeNull()
  })
})

describe('bucketByMonth', () => {
  const order = (iso: string, valueMinor = 100) =>
    ({
      createdAt: new Date(iso),
      subtotalMinor: valueMinor,
      commissionMinor: 0,
      payoutMinor: 0,
      deliveryCostMinor: 0,
      status: 'DELIVERED',
      retailerId: 'r1',
      deliveredAt: null,
    }) as never

  test('twelve bars for a year, not 366', () => {
    const from = new Date('2026-01-01T00:00:00Z')
    const to = new Date('2026-12-31T00:00:00Z')
    expect(bucketByMonth([], from, to)).toHaveLength(12)
  })

  test('keys are YYYY-MM so the frontend can tell them from days', () => {
    const buckets = bucketByMonth(
      [],
      new Date('2026-03-01T00:00:00Z'),
      new Date('2026-04-15T00:00:00Z')
    )
    expect(buckets.map((b) => b.date)).toEqual(['2026-03', '2026-04'])
  })

  test('sums every order in a month', () => {
    const buckets = bucketByMonth(
      [order('2026-03-02T00:00:00Z', 500), order('2026-03-28T00:00:00Z', 250)],
      new Date('2026-03-01T00:00:00Z'),
      new Date('2026-03-31T00:00:00Z')
    )
    expect(buckets).toEqual([{ date: '2026-03', valueMinor: 750, count: 2 }])
  })

  test('an empty month is still a bar', () => {
    // Same reason as empty days: a missing bar reads as a good month.
    const buckets = bucketByMonth(
      [order('2026-01-05T00:00:00Z')],
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-02-28T00:00:00Z')
    )
    expect(buckets[1]).toEqual({ date: '2026-02', valueMinor: 0, count: 0 })
  })

  test('ignores an order outside the window', () => {
    const buckets = bucketByMonth(
      [order('2025-12-31T00:00:00Z')],
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-31T00:00:00Z')
    )
    expect(buckets).toEqual([{ date: '2026-01', valueMinor: 0, count: 0 }])
  })
})
