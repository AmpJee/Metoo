import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The account page's card, from the designer's My Account screen.
 *
 * A white rounded panel on the grey page, with a title row, a hairline rule,
 * then the body. The row carries an optional action on the right — Edit,
 * Change password — because every card on that screen reads before it edits.
 *
 * Deliberately not `components/console/card.tsx`: that one belongs to the
 * seller and admin consoles, which size and space this differently. Same
 * reasoning as `components/ui/` versus `components/console/` — a shared card
 * with a variant flag makes every future tweak to one a risk to the other.
 *
 * Presentational and stateless, so a client component can own the Edit toggle
 * and still render the shell.
 */
export function AccountCard({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string
  icon?: LucideIcon
  /** Rendered right-aligned in the title row. */
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex w-full flex-col gap-5 rounded-[9px] bg-white p-6',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {Icon ? <Icon className="size-5 shrink-0 text-primary" /> : null}
        <h2 className="text-[20px] font-bold text-black">{title}</h2>
        {action ? (
          <div className="flex flex-1 justify-end">{action}</div>
        ) : null}
      </div>

      <div className="h-px w-full bg-[#ddd]" />

      {children}
    </section>
  )
}

/**
 * The card's right-hand control.
 *
 * A link-styled button rather than a filled one: there is one on nearly every
 * card, and five crimson buttons down the page would all shout equally.
 */
export function CardAction({
  icon: Icon,
  children,
  onClick,
}: {
  icon?: LucideIcon
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-2 text-[16px] whitespace-nowrap text-primary transition-opacity hover:opacity-80"
    >
      {Icon ? <Icon className="size-[15px]" /> : null}
      {children}
    </button>
  )
}

/** One label-over-value pair in a card's read-only state. */
export function ReadOnlyRow({
  label,
  value,
  empty,
}: {
  label: string
  value: string | null | undefined
  /** Shown greyed when there is no value — "Not set", not a blank gap. */
  empty?: string
}) {
  const filled = value !== null && value !== undefined && value !== ''

  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[15px] text-black/45">{label}</p>
      <p
        className={cn(
          'text-[18px] break-words',
          filled ? 'text-black' : 'text-black/40'
        )}
      >
        {filled ? value : (empty ?? '—')}
      </p>
    </div>
  )
}

/** The two-column grid the read-only cards lay their rows out in. */
export function ReadOnlyGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
}
