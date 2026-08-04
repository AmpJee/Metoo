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
import { formatBaht } from '@/lib/format'

/**
 * Revenue over time — the seller dashboard's one chart.
 *
 * `/brand/dashboard` returns `{ date, valueMinor, count }` per bucket, which
 * invites plotting revenue and order count together on two y-scales. It is
 * not done here: two scales on one plot invent a correlation the data does
 * not contain. Order count is a stat tile beside this chart instead.
 *
 * One series, so no legend — the card heading says what is plotted. Marks
 * follow the house spec: 2px line, ~10% area wash, hairline solid grid, and
 * axis text in muted ink rather than the series colour.
 *
 * Too few points to be a trend is the caller's call — ChartCard takes an
 * `empty` message for that.
 */

const SERIES = '#cb2957'

export function RevenueChart({
  data,
}: {
  data: { date: string; valueMinor: number; count: number }[]
}) {
  const points = data.map((point) => ({
    ...point,
    // Recharts works in major units; satang would blow out the axis.
    value: point.valueMinor / 100,
  }))

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
        >
          <defs>
            <linearGradient id="revenueWash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES} stopOpacity={0.14} />
              <stop offset="100%" stopColor={SERIES} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Hairline, solid, horizontal only — recessive by design. */}
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
            width={64}
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
            }
          />

          <Tooltip
            cursor={{ stroke: 'var(--color-neutral-line)', strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid var(--color-border)',
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--color-muted-foreground)' }}
            formatter={(_value, _name, item) => [
              formatBaht((item.payload as { valueMinor: number }).valueMinor),
              'Revenue',
            ]}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={SERIES}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#revenueWash)"
            // Points only on hover: a dot on every bucket is noise.
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
