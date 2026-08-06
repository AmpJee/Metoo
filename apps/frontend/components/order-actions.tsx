'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CButton } from '@/components/console/button'
import type { OrderAction, OrderStatus } from '@/lib/types'

/** Why there is nothing to press, given where the order sits. */
function waitingOn(status: OrderStatus | undefined) {
  switch (status) {
    case 'CONFIRMED':
    case 'READY_FOR_PICKUP':
    case 'PICKED_UP':
      return 'With Metoo for delivery — nothing for you to do here.'
    case 'DELIVERED':
      return 'Delivered. Waiting for the retailer to confirm, which releases your payment.'
    case 'SETTLED':
      return 'Complete — this sale is in your wallet.'
    case 'CANCELLED':
      return 'This order was cancelled.'
    case 'CLOSED':
      return 'Closed after a return.'
    default:
      return 'No further action on this order.'
  }
}

/**
 * The buttons that move an order forward.
 *
 * `actions` comes straight from the API, which derives it from the transition
 * table in the backend's domain layer. Nothing here decides what is legal —
 * that would be a second copy of the state machine, free to drift from the
 * one the server enforces.
 *
 * Cancelling is destructive and terminal, so it is styled apart and confirmed.
 */
export function OrderActions({
  actions,
  status,
  onTransition,
}: {
  actions: OrderAction[]
  /** Only used to explain an empty action list. */
  status?: OrderStatus
  onTransition: (to: OrderStatus) => Promise<{ ok: boolean; error?: string }>
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (actions.length === 0) {
    // An empty list means "not yours to move", which is not the same as
    // "finished". Most of the lifecycle now belongs to admin, and the last
    // step belongs to the buyer, so saying "complete" would be wrong on every
    // order between Confirmed and Delivered.
    return <p className="text-[15px] text-black/50">{waitingOn(status)}</p>
  }

  const run = (action: OrderAction) => {
    if (
      action.to === 'CANCELLED' &&
      !window.confirm(
        'Cancel this order? The buyer is notified and it cannot be reopened.'
      )
    ) {
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await onTransition(action.to)
      if (!result.ok) {
        setError(result.error ?? 'Could not update the order.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <CButton
            key={action.to}
            disabled={pending}
            variant={action.to === 'CANCELLED' ? 'danger' : 'primary'}
            className={
              action.to === 'CANCELLED'
                ? 'text-[#d4183d] hover:text-[#d4183d]'
                : undefined
            }
            onClick={() => run(action)}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {action.label}
          </CButton>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-[#d4183d]/10 px-3 py-2 text-[15px] text-[#d4183d]"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
