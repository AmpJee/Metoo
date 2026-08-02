'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { setDeliveryCost } from '@/app/actions/admin'
import { CButton } from '@/components/console/button'
import { CInput } from '@/components/console/field'

/**
 * Record what the courier charged.
 *
 * Entered days after the fact, when the invoice arrives, which is why it is
 * editable on any order rather than part of a status transition. It is the
 * negative term in contribution margin on the summary.
 */
export function DeliveryCostField({
  orderId,
  currentMinor,
}: {
  orderId: string
  currentMinor: number
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="flex items-start gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        setSaved(false)

        const baht = Number(new FormData(event.currentTarget).get('costBaht'))
        if (!Number.isFinite(baht) || baht < 0) {
          setError('Enter a cost of zero or more.')
          return
        }

        startTransition(async () => {
          const result = await setDeliveryCost(orderId, Math.round(baht * 100))
          if (!result.ok) {
            setError(result.error)
            return
          }
          setSaved(true)
          router.refresh()
        })
      }}
    >
      <div className="flex flex-col gap-1">
        <CInput
          name="costBaht"
          type="number"
          step="0.01"
          min="0"
          defaultValue={(currentMinor / 100).toFixed(2)}
          className="h-9 w-28 text-[15px]"
          aria-label="Delivery cost in baht"
        />
        {error ? (
          <span role="alert" className="text-[13px] text-[#d4183d]">
            {error}
          </span>
        ) : saved ? (
          <span className="text-[13px] text-[#1f7a4d]">Saved</span>
        ) : null}
      </div>

      <CButton type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? <Loader2 className="size-3 animate-spin" /> : null}
        Save
      </CButton>
    </form>
  )
}
