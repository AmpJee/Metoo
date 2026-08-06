'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/**
 * Order Quantities — the second chart on the seller dashboard.
 *
 * This is the counterpart to revenue, and the reason it is a *separate card*
 * rather than a second line on the revenue plot: two measures on two y-scales
 * would imply a relationship between baht and order count that the data does
 * not contain. Two plots, one axis each.
 *
 * Same marks as the revenue chart so the pair reads as one system.
 */

const SERIES = '#cb2957'

export function OrderCountChart({
  data,
}: {
  data: { date: string; valueMinor: number; count: number }[]
}) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
        >
          <defs>
            <linearGradient id="ordersWash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES} stopOpacity={0.14} />
              <stop offset="100%" stopColor={SERIES} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="var(--color-border)"
            strokeWidth={1}
          />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            // Orders are whole things — a 2.5 on the axis would be nonsense.
            allowDecimals={false}
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
          />

          <Tooltip
            cursor={{ stroke: 'var(--color-neutral-line)', strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid var(--color-border)',
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--color-muted-foreground)' }}
            formatter={(value) => [String(value), 'Orders']}
          />

          <Area
            type="monotone"
            dataKey="count"
            stroke={SERIES}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#ordersWash)"
            dot={false}
            activeDot={{
              r: 4,
              fill: SERIES,
              stroke: 'var(--color-background)',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
