'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CButton } from '@/components/console/button'
import { useT } from '@/components/i18n-provider'
import type { MessageKey } from '@/lib/i18n'
import type { OrderAction, OrderStatus } from '@/lib/types'

/** Why there is nothing to press, given where the order sits. */
function waitingOn(status: OrderStatus | undefined): MessageKey {
  switch (status) {
    case 'CONFIRMED':
    case 'READY_FOR_PICKUP':
    case 'PICKED_UP':
      return 'sellerOrder.waitingDelivery'
    case 'DELIVERED':
      return 'sellerOrder.waitingBuyer'
    case 'SETTLED':
      return 'sellerOrder.waitingSettled'
    case 'CANCELLED':
      return 'sellerOrder.waitingCancelled'
    case 'CLOSED':
      return 'sellerOrder.waitingClosed'
    default:
      return 'sellerOrder.waitingNone'
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
 * The *wording* is local, though, keyed by destination status. The API's own
 * `label` is English and there is nowhere for it to learn otherwise; taking
 * only the set of legal moves from the server and naming them here keeps the
 * state machine in one place while letting the buttons speak Thai. Each `to`
 * maps to exactly one label across every source state — CANCELLED reads
 * "Cancel Order" from both PENDING and CONFIRMED — so keying by destination
 * loses nothing. `action.label` remains the fallback.
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
  const t = useT()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (actions.length === 0) {
    // An empty list means "not yours to move", which is not the same as
    // "finished". Most of the lifecycle now belongs to admin, and the last
    // step belongs to the buyer, so saying "complete" would be wrong on every
    // order between Confirmed and Delivered.
    return <p className="text-[15px] text-black/50">{t(waitingOn(status))}</p>
  }

  const run = (action: OrderAction) => {
    if (
      action.to === 'CANCELLED' &&
      !window.confirm(t('sellerOrder.cancelAsk'))
    ) {
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await onTransition(action.to)
      if (!result.ok) {
        setError(result.error ?? t('sellerOrder.transitionFailed'))
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
            {t(`action.${action.to}`) || action.label}
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
