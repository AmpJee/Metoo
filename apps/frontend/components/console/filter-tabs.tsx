import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The filter row above a console table — status tabs, pipeline stages.
 *
 * Selected is a solid crimson pill, matching the sidebar's active item and
 * the period toggle, so "what am I looking at" reads the same way everywhere.
 *
 * Links rather than buttons: the filter is a query parameter, so the choice
 * survives a reload and can be shared.
 */
export function FilterTabs({
  items,
}: {
  items: {
    href: string
    label: string
    active: boolean
    /** Omitted when a count would be meaningless or expensive. */
    count?: number
  }[]
}) {
  return (
    <nav className="flex gap-[6px] overflow-x-auto pb-[2px]">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          className={cn(
            'flex shrink-0 items-center gap-[8px] rounded-full px-[16px] py-[8px] text-[15px] transition-colors',
            item.active
              ? 'bg-[#cb2957] text-white'
              : 'bg-[#f5f5f5] text-black hover:bg-[#cb2957]/10'
          )}
        >
          {item.label}
          {item.count !== undefined && item.count > 0 ? (
            <span
              className={cn(
                'text-[13px]',
                item.active ? 'text-white/70' : 'text-black/40'
              )}
            >
              {item.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  )
}
