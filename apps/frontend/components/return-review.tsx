'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CButton } from '@/components/console/button'
import { CTextarea } from '@/components/console/field'

/**
 * Accept or reject a return.
 *
 * Both outcomes take a note, because both are decisions the buyer sees: an
 * accepted return refunds them and closes the order, a rejected one leaves it
 * closed as delivered. Neither should arrive without a reason.
 *
 * Shared by the seller and admin consoles — same shape, different endpoint,
 * so the caller supplies the action.
 */
export function ReturnReview({
  onReview,
}: {
  onReview: (
    decision: 'accept' | 'reject',
    note: string
  ) => Promise<{ ok: boolean; error?: string }>
}) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const run = (decision: 'accept' | 'reject') => {
    const verb = decision === 'accept' ? 'Accept' : 'Reject'
    if (
      !window.confirm(
        decision === 'accept'
          ? 'Accept this return? The item total is refunded to the buyer and debited from the wallet.'
          : 'Reject this return? The order stays closed as delivered.'
      )
    ) {
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await onReview(decision, note.trim())
      if (!result.ok) {
        setError(result.error ?? `${verb} failed.`)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <CTextarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Explain the decision — the buyer sees this."
      />

      <div className="flex flex-wrap gap-2">
        <CButton disabled={pending} onClick={() => run('accept')}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Accept &amp; refund
        </CButton>
        <CButton
          variant="secondary"
          disabled={pending}
          className="text-[#d4183d] hover:text-[#d4183d]"
          onClick={() => run('reject')}
        >
          Reject
        </CButton>
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
