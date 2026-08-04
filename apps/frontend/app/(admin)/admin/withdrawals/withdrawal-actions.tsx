'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  approveWithdrawal,
  markWithdrawalPaid,
  rejectWithdrawal,
} from '@/app/actions/admin'
import { CButton } from '@/components/console/button'
import { CInput } from '@/components/console/field'
import { CTextarea } from '@/components/console/field'
import type { WithdrawalStatus } from '@/lib/types'

/**
 * The payout workflow: requested → approved → paid, or rejected.
 *
 * Marking paid requires the bank's transfer reference. That reference is the
 * only link between a ledger row and real money leaving the account, so it is
 * mandatory rather than a nicety — the API rejects the call without one.
 */
export function WithdrawalActions({
  id,
  status,
}: {
  id: string
  status: WithdrawalStatus
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'reject' | 'paid'>('idle')
  const [note, setNote] = useState('')
  const [ref, setRef] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null)
    startTransition(async () => {
      const result = await fn()
      if (!result.ok) {
        setError(result.error ?? 'That did not work.')
        return
      }
      setMode('idle')
      setNote('')
      setRef('')
      router.refresh()
    })
  }

  if (status === 'REJECTED' || status === 'PAID') {
    return <span className="text-[13px] text-black/50">No action</span>
  }

  return (
    <div className="flex min-w-[220px] flex-col gap-2">
      {status === 'REQUESTED' && mode === 'idle' ? (
        <div className="flex gap-2">
          <CButton
            size="sm"
            disabled={pending}
            onClick={() => run(() => approveWithdrawal(id))}
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : null}
            Approve
          </CButton>
          <CButton
            size="sm"
            variant="secondary"
            className="text-[#d4183d] hover:text-[#d4183d]"
            disabled={pending}
            onClick={() => setMode('reject')}
          >
            Reject
          </CButton>
        </div>
      ) : null}

      {status === 'APPROVED' && mode === 'idle' ? (
        <CButton size="sm" disabled={pending} onClick={() => setMode('paid')}>
          Mark paid
        </CButton>
      ) : null}

      {mode === 'reject' ? (
        <>
          <CTextarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Why — the brand sees this."
            className="min-h-0 text-[15px]"
          />
          <div className="flex gap-2">
            <CButton
              size="sm"
              variant="secondary"
              className="text-[#d4183d] hover:text-[#d4183d]"
              disabled={pending || !note.trim()}
              onClick={() => run(() => rejectWithdrawal(id, note.trim()))}
            >
              Confirm reject
            </CButton>
            <CButton size="sm" variant="ghost" onClick={() => setMode('idle')}>
              Cancel
            </CButton>
          </div>
        </>
      ) : null}

      {mode === 'paid' ? (
        <>
          <CInput
            value={ref}
            onChange={(event) => setRef(event.target.value)}
            maxLength={200}
            placeholder="Bank transfer reference"
            className="h-9 text-[15px]"
          />
          <div className="flex gap-2">
            <CButton
              size="sm"
              disabled={pending || !ref.trim()}
              onClick={() => run(() => markWithdrawalPaid(id, ref.trim()))}
            >
              Confirm paid
            </CButton>
            <CButton size="sm" variant="ghost" onClick={() => setMode('idle')}>
              Cancel
            </CButton>
          </div>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="text-[13px] text-[#d4183d]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
