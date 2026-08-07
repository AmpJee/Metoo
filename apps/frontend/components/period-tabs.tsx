import Link from 'next/link'
import { getT } from '@/lib/i18n/server'
import type { MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const PERIODS = [
  { key: 'day', labelKey: 'period.day' },
  { key: 'week', labelKey: 'period.week' },
  { key: 'month', labelKey: 'period.month' },
  { key: 'year', labelKey: 'period.year' },
] as const satisfies readonly { key: string; labelKey: MessageKey }[]

/**
 * The Day / Week / Month / Year toggle.
 *
 * Links, not buttons: `period` is a real query parameter on both
 * /brand/dashboard and /admin/summary, so the server re-renders with the new
 * window and the choice survives a reload or a shared URL.
 *
 * Selected state is a solid crimson pill, matching the sidebar's active item.
 */
export async function PeriodTabs({
  basePath,
  active,
}: {
  basePath: string
  active: string
}) {
  const t = await getT()

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
          {t(period.labelKey)}
        </Link>
      ))}
    </nav>
  )
}
