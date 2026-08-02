import { Check } from 'lucide-react'
import { buyerStatusLabel, TRACKER_STEPS } from '@/lib/order-status'
import type { OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The seven-step order tracker.
 *
 * CANCELLED and CLOSED are terminal and sit outside the sequence, so they get
 * a plain message instead of a progress rail — showing a half-filled track
 * for a cancelled order would misrepresent it.
 */
export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED' || status === 'CLOSED') {
    return (
      <div className="rounded-[9px] border border-border p-4 text-sm text-muted-foreground">
        This order is {status === 'CANCELLED' ? 'cancelled' : 'closed'}.
      </div>
    )
  }

  const current = TRACKER_STEPS.indexOf(
    status as (typeof TRACKER_STEPS)[number]
  )

  return (
    <ol className="flex flex-col gap-0">
      {TRACKER_STEPS.map((step, index) => {
        const done = index <= current
        const isLast = index === TRACKER_STEPS.length - 1
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px]',
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-neutral-line text-muted-foreground'
                )}
              >
                {done ? <Check className="size-3" /> : index + 1}
              </span>
              {!isLast ? (
                <span
                  className={cn(
                    'h-8 w-px',
                    index < current ? 'bg-primary' : 'bg-neutral-line'
                  )}
                />
              ) : null}
            </div>
            <span
              className={cn(
                'pt-0.5 text-sm',
                done ? 'font-medium' : 'text-muted-foreground'
              )}
            >
              {buyerStatusLabel(step)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
