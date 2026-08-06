'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatBaht } from '@/lib/format'

/**
 * GMV by brand.
 *
 * One measure across nominal categories, so every bar is the same colour.
 * Shading them darker-where-bigger would double-encode bar length as hue —
 * spending the only free channel on information the length already carries.
 *
 * Horizontal, because brand names are long and would otherwise be rotated or
 * truncated on an x-axis.
 */

const SERIES = '#cb2957'

export function GmvByBrandChart({
  data,
}: {
  data: { brandId: string; name: string; gmvMinor: number }[]
}) {
  // Tallest first — the ordering is the comparison.
  const rows = [...data]
    .sort((a, b) => b.gmvMinor - a.gmvMinor)
    .map((row) => ({ ...row, value: row.gmvMinor / 100 }))

  // Enough room for a bar plus air, capped so three brands do not become
  // three fat slabs.
  const height = Math.max(180, rows.length * 44)

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
          barCategoryGap={12}
        >
          <CartesianGrid
            horizontal={false}
            stroke="var(--color-border)"
            strokeWidth={1}
          />

          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
          />

          <Tooltip
            cursor={{ fill: 'var(--color-secondary)' }}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid var(--color-border)',
              fontSize: 12,
            }}
            formatter={(_value, _name, item) => [
              formatBaht((item.payload as { gmvMinor: number }).gmvMinor),
              'GMV',
            ]}
          />

          {/* Capped thickness with a rounded data-end, square at the baseline. */}
          <Bar
            dataKey="value"
            fill={SERIES}
            maxBarSize={24}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
