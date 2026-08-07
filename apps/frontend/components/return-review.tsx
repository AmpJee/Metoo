'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CButton } from '@/components/console/button'
import { CTextarea } from '@/components/console/field'
import { useT } from '@/components/i18n-provider'

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
  const t = useT()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const run = (decision: 'accept' | 'reject') => {
    if (
      !window.confirm(
        t(
          decision === 'accept'
            ? 'returnReview.acceptAsk'
            : 'returnReview.rejectAsk'
        )
      )
    ) {
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await onReview(decision, note.trim())
      if (!result.ok) {
        // One message for both decisions. The English used to interpolate the
        // verb ("Accept failed."), which Thai cannot build the same way and
        // which said nothing the button did not already say.
        setError(result.error ?? t('returnReview.failed'))
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
        placeholder={t('returnReview.notePlaceholder')}
      />

      <div className="flex flex-wrap gap-2">
        <CButton disabled={pending} onClick={() => run('accept')}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {t('returnReview.accept')}
        </CButton>
        <CButton
          variant="secondary"
          disabled={pending}
          className="text-[#d4183d] hover:text-[#d4183d]"
          onClick={() => run('reject')}
        >
          {t('returnReview.reject')}
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
