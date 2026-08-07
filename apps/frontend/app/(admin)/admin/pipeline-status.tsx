'use client'

import { PIPELINE_STATUSES } from '@metoo/shared'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useT } from '@/components/i18n-provider'
import { setPipelineStatus } from '@/app/actions/admin'
import { CButton } from '@/components/console/button'
import { CSelect, CTextarea } from '@/components/console/field'
import type { PipelineStatus } from '@/lib/types'

/**
 * Move an applicant along the pipeline.
 *
 * ONBOARDED is the gate that lets an account trade at all, so this control is
 * the single most consequential thing in the console.
 *
 * DECLINED requires a note: the API rejects it without one, and the applicant
 * is shown what it says. The note field appears as soon as DECLINED is chosen
 * rather than after a failed submit.
 */
export function PipelineStatusControl({
  userId,
  current,
}: {
  userId: string
  current: PipelineStatus
}) {
  const router = useRouter()
  const [status, setStatus] = useState<PipelineStatus>(current)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const t = useT()
  const [pending, startTransition] = useTransition()

  const changed = status !== current
  const needsNote = status === 'DECLINED'

  return (
    <div className="flex flex-col gap-2">
      <CSelect
        value={status}
        disabled={pending}
        onChange={(event) => setStatus(event.target.value as PipelineStatus)}
        className="h-9 text-[15px]"
      >
        {PIPELINE_STATUSES.map((value) => (
          <option key={value} value={value}>
            {t(`pipeline.${value}`)}
          </option>
        ))}
      </CSelect>

      {changed && needsNote ? (
        <CTextarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          maxLength={1000}
          placeholder={t('pipelineControl.notePlaceholder')}
          className="min-h-0 text-[15px]"
        />
      ) : null}

      {changed ? (
        <div className="flex gap-2">
          <CButton
            size="sm"
            disabled={pending || (needsNote && !note.trim())}
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const result = await setPipelineStatus(
                  userId,
                  status,
                  note.trim() || undefined
                )
                if (!result.ok) {
                  setError(result.error)
                  setStatus(current)
                  return
                }
                setNote('')
                router.refresh()
              })
            }}
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : null}
            Save
          </CButton>
          <CButton
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setStatus(current)
              setNote('')
              setError(null)
            }}
          >
            {t('common.cancel')}
          </CButton>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-[13px] text-[#d4183d]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
