import Link from 'next/link'
import { cn } from '@/lib/utils'

const PERIODS = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
] as const

/**
 * The Day / Week / Month / Year toggle.
 *
 * Links, not buttons: `period` is a real query parameter on both
 * /brand/dashboard and /admin/summary, so the server re-renders with the new
 * window and the choice survives a reload or a shared URL.
 *
 * Selected state is a solid crimson pill, matching the sidebar's active item.
 */
export function PeriodTabs({
  basePath,
  active,
}: {
  basePath: string
  active: string
}) {
  return (
    <nav className="flex gap-[6px] rounded-[9px] bg-white p-[6px]">
      {PERIODS.map((period) => (
        <Link
          key={period.key}
          href={`${basePath}?period=${period.key}`}
          aria-current={period.key === active ? 'page' : undefined}
          className={cn(
            'rounded-[6px] px-[18px] py-[8px] text-[16px] transition-colors',
            period.key === active
              ? 'bg-[#cb2957] text-white'
              : 'text-black hover:bg-[#cb2957]/10'
          )}
        >
          {period.label}
        </Link>
      ))}
    </nav>
  )
}
