'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useT } from '@/components/i18n-provider'

export interface ProfileField {
  name: string
  label: string
  value: string
  /** Rendered as a textarea rather than a single line. */
  multiline?: boolean
  optional?: boolean
  hint?: string
  maxLength?: number
}

/**
 * The shared profile editor for both roles.
 *
 * One component because the two forms differ only in which fields they list —
 * the save behaviour, the diffing and the error handling are identical, and
 * two copies would drift the first time one of them gained validation.
 *
 * The caller owns the save, because a retailer PATCHes /retailer/profile and a
 * brand PATCHes /brand/profile with different shapes. This handles everything
 * around it.
 *
 * `onSaved` and `onCancel` are for a caller that shows this inside a
 * read-only → Edit toggle, as the buyer's account page does. Passing them
 * hands the "saved" feedback back to that caller — the card collapses to its
 * read-only state, which says the same thing a green banner would. Omit them
 * and the form stays always-open with its own confirmation, which is what the
 * seller console does.
 */
export function ProfileForm({
  fields,
  onSave,
  onSaved,
  onCancel,
}: {
  fields: ProfileField[]
  onSave: (
    values: Record<string, string>
  ) => Promise<{ ok: boolean; error?: string }>
  onSaved?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    const values: Record<string, string> = {}
    for (const field of fields) {
      values[field.name] = String(data.get(field.name) ?? '').trim()
    }

    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await onSave(values)
      if (!result.ok) {
        setError(result.error ?? t('settings.saveFailed'))
        return
      }
      // Only one of the two runs: a caller with an Edit toggle collapses the
      // card, everyone else gets the inline banner.
      if (onSaved) onSaved()
      else setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-[560px] flex-col gap-4">
      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            {field.label}
            {field.optional ? (
              <span className="ml-1 font-normal text-muted-foreground">
                {t('common.optional')}
              </span>
            ) : null}
          </span>

          {field.multiline ? (
            <textarea
              name={field.name}
              defaultValue={field.value}
              required={!field.optional}
              maxLength={field.maxLength}
              rows={3}
              className="rounded-[9px] border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
            />
          ) : (
            <input
              name={field.name}
              defaultValue={field.value}
              required={!field.optional}
              maxLength={field.maxLength}
              className="h-10 rounded-[9px] border border-border bg-transparent px-3 text-sm outline-none focus:border-primary"
            />
          )}

          {field.hint ? (
            <span className="text-xs text-muted-foreground">{field.hint}</span>
          ) : null}
        </label>
      ))}

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {saved ? (
        <p
          role="status"
          className="rounded-md bg-success/10 px-3 py-2 text-sm text-success"
        >
          {t('common.saved')}
        </p>
      ) : null}

      <div className="flex items-center gap-5">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            {t('common.cancel')}
          </button>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-[9px] bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {t('common.save')}
        </button>
      </div>
    </form>
  )
}
