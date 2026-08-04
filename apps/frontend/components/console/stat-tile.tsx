import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A single figure, to the design's card spec.
 *
 * Two variants, both from the designer's file:
 *   default — white card, optional tinted icon chip, value at 28px
 *   hero    — solid crimson, value at 40px, spans two columns
 *
 * The value uses proportional figures deliberately. `tabular-nums` gives every
 * digit the width of a zero, which reads loose at 28–40px; tabular belongs in
 * table columns, where digits must line up.
 */

/** Icon chip tints. Each is a real status colour from the design. */
const TINTS = {
  primary: { chip: 'bg-[#cb2957]/10', icon: 'text-[#cb2957]' },
  success: { chip: 'bg-[#1f7a4d]/10', icon: 'text-[#1f7a4d]' },
  warning: { chip: 'bg-[#c47f00]/10', icon: 'text-[#c47f00]' },
  info: { chip: 'bg-[#7a4dcb]/10', icon: 'text-[#7a4dcb]' },
} as const

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tint = 'primary',
  className,
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tint?: keyof typeof TINTS
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-center gap-[10px] rounded-[9px] bg-white p-[24px]',
        className
      )}
    >
      <div className="flex items-center gap-[10px]">
        {Icon ? (
          <span
            className={cn(
              'flex size-[40px] shrink-0 items-center justify-center rounded-[8px]',
              TINTS[tint].chip
            )}
          >
            <Icon
              className={cn('size-[22px]', TINTS[tint].icon)}
              strokeWidth={1.75}
            />
          </span>
        ) : null}
        <p className="text-[16px] text-black/50">{label}</p>
      </div>

      <p className="text-[28px] leading-tight font-bold text-black">{value}</p>

      {hint ? <p className="text-[14px] text-black/50">{hint}</p> : null}
    </div>
  )
}

/**
 * The crimson headline card — one per screen, spanning two columns.
 *
 * `action` is the white pill button the design puts inside it (Withdraw on
 * the seller dashboard).
 */
export function HeroTile({
  label,
  value,
  action,
  footnote,
  className,
}: {
  label: string
  value: string
  action?: React.ReactNode
  footnote?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-[16px] rounded-[9px] bg-[#cb2957] p-[24px] md:col-span-2',
        className
      )}
    >
      <p className="text-[16px] text-white/80">{label}</p>
      <p className="text-[40px] leading-tight font-bold text-white">{value}</p>

      {action || footnote ? (
        <div className="flex flex-wrap items-center gap-[12px]">
          {action}
          {footnote ? (
            <span className="flex items-center gap-[8px] text-[15px] text-white/80">
              {footnote}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
