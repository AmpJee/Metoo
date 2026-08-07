import { Check } from 'lucide-react'
import { getT } from '@/lib/i18n/server'
import { BUYER_TRACKER_STEPS, buyerStatusLabel } from '@/lib/order-status'
import type { OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The buyer's five-step order tracker.
 *
 * SETTLED is not a sixth dot. To the retailer it is not a further stage their
 * parcel passes through — it is the button they press on step 5, so a settled
 * order shows all five steps complete rather than implying something happened
 * after they confirmed.
 *
 * CANCELLED and CLOSED are terminal and sit outside the sequence, so they get
 * a plain message instead of a progress rail — showing a half-filled track
 * for a cancelled order would misrepresent it.
 */
export async function OrderTracker({ status }: { status: OrderStatus }) {
  const t = await getT()

  if (status === 'CANCELLED' || status === 'CLOSED') {
    return (
      <div className="rounded-[9px] border border-border p-4 text-sm text-muted-foreground">
        {/* Two whole sentences rather than a slot in one. Thai does not put
            an adjective where English does, so "This order is {x}." cannot be
            assembled from a fragment. */}
        {t(status === 'CANCELLED' ? 'order.cancelled' : 'order.closed')}
      </div>
    )
  }

  // SETTLED is past the last visible step, so every dot is filled.
  const current =
    status === 'SETTLED'
      ? BUYER_TRACKER_STEPS.length - 1
      : BUYER_TRACKER_STEPS.indexOf(
          status as (typeof BUYER_TRACKER_STEPS)[number]
        )

  return (
    <ol className="flex flex-col gap-0">
      {BUYER_TRACKER_STEPS.map((step, index) => {
        const done = index <= current
        const isLast = index === BUYER_TRACKER_STEPS.length - 1
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
              {buyerStatusLabel(step, t)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
