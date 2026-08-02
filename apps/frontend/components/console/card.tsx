import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The console's one container: a white card, `rounded-[9px] p-[24px]`.
 *
 * Everything on a console screen lives in one of these — tables, forms,
 * lists, tiles. The page is grey; the cards are what make it readable.
 */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-[16px] rounded-[9px] bg-white p-[24px]',
        className
      )}
      {...props}
    />
  )
}

/** Card heading, optionally with a link or control on the right. */
export function CardHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-[12px]">
      <h2 className="text-[20px] font-bold text-black">{title}</h2>
      {action}
    </div>
  )
}

/**
 * Empty state inside a card.
 *
 * Quieter than the buyer site's dashed box — an operator sees these often,
 * and a heavy placeholder in every empty tab becomes noise.
 */
export function CardEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-[8px] py-[48px] text-center">
      <Icon className="size-[28px] text-black/20" strokeWidth={1.5} />
      <p className="text-[16px] font-bold text-black">{title}</p>
      {description ? (
        <p className="max-w-[380px] text-[15px] text-black/50">{description}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-[8px] rounded-[6px] bg-[#cb2957] px-[28px] py-[12px] text-[16px] font-bold text-white transition-opacity hover:opacity-90"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
