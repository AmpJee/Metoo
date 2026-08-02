/**
 * Dashboard arithmetic — pure, no Prisma, no I/O.
 *
 * Both dashboards are the first screen their role sees, and every figure on
 * them is a number someone will make a decision from. Keeping the maths here
 * rather than inside a query means each definition is stated once and tested:
 * "average order value" and "repeat rate" are the sort of metric that quietly
 * means three different things in three different places otherwise.
 */

export type Period = 'day' | 'week' | 'month' | 'year'

/** Days each period covers, for the Day/Week/Month/Year toggle. */
const PERIOD_DAYS: Record<Period, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
}

/** The inclusive start of a period ending now. */
export function periodStart(period: Period, now = new Date()): Date {
  return new Date(now.getTime() - PERIOD_DAYS[period] * 86_400_000)
}

export interface OrderFact {
  createdAt: Date
  subtotalMinor: number
  commissionMinor: number
  deliveryCostMinor: number
  retailerId: string
  deliveredAt: Date | null
}

/**
 * Average order value.
 *
 * Integer division, floored: an AOV of "฿1,954.6" is false precision on money
 * that only exists in whole satang. Zero orders is zero, not a division error.
 */
export function averageOrderValue(orders: OrderFact[]): number {
  if (orders.length === 0) return 0
  const total = orders.reduce((sum, o) => sum + o.subtotalMinor, 0)
  return Math.floor(total / orders.length)
}

export interface RepeatRate {
  /** Orders from retailers who had ordered before. */
  repeatOrders: number
  totalOrders: number
  /** Whole percent, rounded. */
  percent: number
}

/**
 * What share of orders came from a returning buyer.
 *
 * A retailer's *first* order is never a repeat; every subsequent one is. That
 * counts orders rather than retailers, which is what the design's caption
 * describes — "2,960 of 4,188 real orders".
 *
 * Orders must be passed oldest first, since which order is "first" for a
 * retailer depends on the ordering.
 */
export function repeatOrderRate(orders: OrderFact[]): RepeatRate {
  const seen = new Set<string>()
  let repeatOrders = 0

  for (const order of orders) {
    if (seen.has(order.retailerId)) repeatOrders++
    else seen.add(order.retailerId)
  }

  return {
    repeatOrders,
    totalOrders: orders.length,
    percent:
      orders.length === 0
        ? 0
        : Math.round((repeatOrders / orders.length) * 100),
  }
}

/**
 * What the platform actually keeps.
 *
 * commission − logistics. The design labels it "commission − Omise −
 * logistics"; there is no payment gateway yet, so that term is zero and the
 * caller can subtract it when one exists.
 */
export function contributionMarginMinor(
  orders: OrderFact[],
  gatewayFeesMinor = 0
): number {
  const commission = orders.reduce((sum, o) => sum + o.commissionMinor, 0)
  const logistics = orders.reduce((sum, o) => sum + o.deliveryCostMinor, 0)
  return commission - logistics - gatewayFeesMinor
}

/**
 * Mean hours from order placed to delivered.
 *
 * Undelivered orders are excluded rather than counted as zero — including them
 * would make the average fall every time a new order arrives, which is the
 * opposite of what the number is for.
 */
export function averageFulfilmentHours(orders: OrderFact[]): number | null {
  const delivered = orders.filter((o) => o.deliveredAt !== null)
  if (delivered.length === 0) return null

  const totalMs = delivered.reduce(
    (sum, o) => sum + (o.deliveredAt!.getTime() - o.createdAt.getTime()),
    0
  )

  return Math.round(totalMs / delivered.length / 3_600_000)
}

export interface Bucket {
  /** ISO date, YYYY-MM-DD. */
  date: string
  valueMinor: number
  count: number
}

/**
 * Totals per day across a window, including days with nothing.
 *
 * The empty days matter: a bar chart that silently omits Wednesday shows six
 * bars and reads as a good week rather than a missing day.
 */
export function bucketByDay(
  orders: OrderFact[],
  from: Date,
  to = new Date()
): Bucket[] {
  const buckets = new Map<string, Bucket>()

  for (
    let day = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
    );
    day <= to;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const key = day.toISOString().slice(0, 10)
    buckets.set(key, { date: key, valueMinor: 0, count: 0 })
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue // outside the window
    bucket.valueMinor += order.subtotalMinor
    bucket.count += 1
  }

  return [...buckets.values()]
}

/**
 * Totals per calendar month, for the Year view.
 *
 * A year bucketed by day is 366 bars. The design's chart has room for a
 * handful, so at that range the axis has to be months — twelve bars, keyed
 * YYYY-MM, empty months included for the same reason empty days are.
 */
export function bucketByMonth(
  orders: OrderFact[],
  from: Date,
  to = new Date()
): Bucket[] {
  const buckets = new Map<string, Bucket>()

  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1)
  )
  const last = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1)

  while (cursor.getTime() <= last) {
    const key = cursor.toISOString().slice(0, 7)
    buckets.set(key, { date: key, valueMinor: 0, count: 0 })
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 7)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.valueMinor += order.subtotalMinor
    bucket.count += 1
  }

  return [...buckets.values()]
}

/**
 * Mean days from signup to a retailer's first order.
 *
 * Retailers who have not ordered yet are excluded — they have no elapsed time
 * to measure, and counting them as zero would flatter the number.
 */
export function averageDaysToFirstOrder(
  retailers: Array<{ createdAt: Date; firstOrderAt: Date | null }>
): number | null {
  const converted = retailers.filter((r) => r.firstOrderAt !== null)
  if (converted.length === 0) return null

  const totalMs = converted.reduce(
    (sum, r) => sum + (r.firstOrderAt!.getTime() - r.createdAt.getTime()),
    0
  )

  return Math.round(totalMs / converted.length / 86_400_000)
}
