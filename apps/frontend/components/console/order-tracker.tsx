import { Check } from 'lucide-react'
import { getT } from '@/lib/i18n/server'
import { statusLabel, TRACKER_STEPS } from '@/lib/order-status'
import type { OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The six-step order tracker, in the console's tokens.
 *
 * A near-twin of the buyer's `components/order-tracker.tsx`, deliberately
 * kept apart: the two design systems size and colour this differently, and
 * one shared component with a variant flag would make every future tweak to
 * either side a risk to the other. They also now show different step counts —
 * the console shows all six, the buyer only the five that are theirs.
 *
 * CANCELLED and CLOSED sit outside the sequence and get a plain message —
 * a half-filled rail would misrepresent a cancelled order.
 */
export async function OrderTracker({ status }: { status: OrderStatus }) {
  const t = await getT()

  if (status === 'CANCELLED' || status === 'CLOSED') {
    return (
      <p className="rounded-[8px] bg-[#f5f5f5] px-[16px] py-[12px] text-[15px] text-black/50">
        {t(
          status === 'CANCELLED'
            ? 'sellerOrder.cancelled'
            : 'sellerOrder.closed'
        )}
      </p>
    )
  }

  const current = TRACKER_STEPS.indexOf(
    status as (typeof TRACKER_STEPS)[number]
  )

  return (
    <ol className="flex flex-col">
      {TRACKER_STEPS.map((step, index) => {
        const done = index <= current
        const isLast = index === TRACKER_STEPS.length - 1
        return (
          <li key={step} className="flex gap-[14px]">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-[28px] shrink-0 items-center justify-center rounded-full text-[13px]',
                  done
                    ? 'bg-[#cb2957] text-white'
                    : 'bg-[#f5f5f5] text-black/40'
                )}
              >
                {done ? <Check className="size-[15px]" /> : index + 1}
              </span>
              {!isLast ? (
                <span
                  className={cn(
                    'h-[28px] w-px',
                    index < current ? 'bg-[#cb2957]' : 'bg-black/10'
                  )}
                />
              ) : null}
            </div>
            <span
              className={cn(
                'pt-[4px] text-[16px]',
                done ? 'font-bold text-black' : 'text-black/50'
              )}
            >
              {statusLabel(step, t)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
