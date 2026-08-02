'use client'

import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { resolveFeedback } from '@/app/actions/admin'
import { CButton } from '@/components/console/button'
import { CTextarea } from '@/components/console/field'

/** Close a feedback entry, optionally recording what was done about it. */
export function ResolveButton({ id }: { id: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!open) {
    return (
      <CButton size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Check className="size-3.5" /> Resolve
      </CButton>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <CTextarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="What was done about it (optional, internal)."
        className="min-h-0 text-[15px]"
      />
      <div className="flex gap-2">
        <CButton
          size="sm"
          disabled={pending}
          onClick={() => {
            setError(null)
            startTransition(async () => {
              const result = await resolveFeedback(id, note.trim() || undefined)
              if (!result.ok) {
                setError(result.error)
                return
              }
              setOpen(false)
              router.refresh()
            })
          }}
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : null}
          Mark resolved
        </CButton>
        <CButton size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </CButton>
      </div>
      {error ? (
        <p role="alert" className="text-[13px] text-[#d4183d]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
