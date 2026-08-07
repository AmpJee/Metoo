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
 */
export function ProfileForm({
  fields,
  onSave,
}: {
  fields: ProfileField[]
  onSave: (
    values: Record<string, string>
  ) => Promise<{ ok: boolean; error?: string }>
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
      setSaved(true)
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

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-[9px] bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t('common.save')}
      </button>
    </form>
  )
}
