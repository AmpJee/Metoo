'use client'

import { CheckCircle2, Loader2, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { confirmSlipUpload, requestSlipUpload } from '@/app/actions/orders'
import { useLocale, useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'

/** Matches MAX_DOCUMENT_BYTES on the API. */
const MAX_BYTES = 10 * 1024 * 1024
// PDF is here and not on product photos: banking apps hand out PDF receipts as
// readily as screenshots, and a slip is only ever downloaded by an admin, never
// rendered into a page.
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

/**
 * Send the bank transfer slip.
 *
 * Payment is a manual transfer, so this is the only evidence anyone has that
 * money moved — and until it arrives, an admin has nothing to check and the
 * order sits still. That is why it lives on the pay screen next to the QR
 * rather than somewhere in the order's history.
 *
 * Three steps, same as every other upload here: ask for a signed URL, PUT the
 * bytes straight to storage, then confirm the key. Uploading does NOT mark the
 * order paid — an admin checks the slip first — so nothing here may say it did.
 */
export function PaymentSlipUpload({
  orderId,
  sentAt,
}: {
  orderId: string
  /** Set once a slip has been sent; re-uploading replaces it. */
  sentAt: string | null
}) {
  const router = useRouter()
  const t = useT()
  const locale = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const [sent, setSent] = useState(sentAt)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)

    // Checked here so an unusable file is refused instantly rather than after
    // two round-trips. The API enforces the same limits regardless.
    if (!ACCEPTED.includes(file.type)) {
      setError(t('slip.badType'))
      return
    }
    if (file.size > MAX_BYTES) {
      setError(t('slip.tooLarge'))
      return
    }

    startTransition(async () => {
      const signed = await requestSlipUpload(orderId, file.type, file.size)
      if (!signed.ok) {
        setError(signed.error)
        return
      }

      const put = await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type },
        body: file,
      }).catch(() => null)

      if (!put?.ok) {
        setError(t('slip.failed'))
        return
      }

      const confirmed = await confirmSlipUpload(orderId, signed.storageKey)
      if (!confirmed.ok) {
        setError(confirmed.error)
        return
      }

      setSent(confirmed.order.paymentSlipAt)
      router.refresh()
    })
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[9px] border border-border p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">{t('slip.title')}</h2>
        <p className="text-xs text-muted-foreground">{t('slip.hint')}</p>
      </div>

      {sent ? (
        // Deliberately "we have it", not "you have paid". An admin still has
        // to look at the slip, and the order is still To Pay until they do.
        <p className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          {t('slip.sent', { when: formatDate(sent, locale) })}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={onPick}
        disabled={pending}
        className="sr-only"
      />

      <Button
        type="button"
        variant={sent ? 'outline' : 'default'}
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? (
          <Loader2 className="mr-1 size-4 animate-spin" />
        ) : (
          <Upload className="mr-1 size-4" />
        )}
        {t(sent ? 'slip.replace' : 'slip.upload')}
      </Button>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
