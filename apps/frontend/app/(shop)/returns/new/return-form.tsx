'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { requestReturn } from '@/app/actions/returns'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'

export function ReturnForm({ orderId }: { orderId: string }) {
  const router = useRouter()
  const t = useT()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        startTransition(async () => {
          const result = await requestReturn(orderId, reason.trim())
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.replace('/returns')
          router.refresh()
        })
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('returnNew.prompt')}</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
          minLength={1}
          maxLength={2000}
          rows={6}
          placeholder={t('returnNew.placeholder')}
          className="rounded-lg bg-input px-3 py-2 text-sm placeholder:text-muted-foreground"
        />
        <span className="text-xs text-muted-foreground">
          {reason.length}/2000
        </span>
      </label>

      {/* TODO(api): the design allows attaching photos. The API accepts
          photoUrls, but uploading needs a retailer-facing signed-URL route —
          POST /brand/products/:id/photo is brand-only. Omitted rather than
          shown as a control that cannot work. */}

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending || !reason.trim()}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t('returnNew.submit')}
      </Button>
    </form>
  )
}
