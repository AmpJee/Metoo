import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'

/**
 * The design gives every list an explicit empty state rather than a blank
 * area ("Your cart is empty", "No orders here yet", "No products found").
 * One component so they cannot drift apart.
 */
export function EmptyState({
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-line px-6 py-16 text-center">
      <Icon className="size-8 text-neutral-mid" strokeWidth={1.5} />
      <p className="text-base font-medium">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? (
        <Button asChild className="mt-2">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  )
}
