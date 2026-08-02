'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CButton } from '@/components/console/button'
import type { OrderAction, OrderStatus } from '@/lib/types'

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
  onTransition,
}: {
  actions: OrderAction[]
  onTransition: (to: OrderStatus) => Promise<{ ok: boolean; error?: string }>
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (actions.length === 0) {
    return (
      <p className="text-[15px] text-black/50">
        No further action — this order is complete.
      </p>
    )
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
