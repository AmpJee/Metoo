'use client'

import { ImageUp, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import {
  confirmPictureUpload,
  requestPictureUpload,
} from '@/app/actions/account'
import { useT } from '@/components/i18n-provider'

/** Matches MAX_PHOTO_BYTES on the API. */
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Profile picture, uploaded in two steps.
 *
 *   1. ask the API for a signed URL   (server action, our session)
 *   2. PUT the bytes to Supabase      (browser → storage, signed URL)
 *   3. confirm the key with the API   (server action)
 *
 * Step 2 goes straight from the browser so the image never travels through the
 * Next server. Step 3 exists because the API checks the object really landed
 * before recording it — the profile cannot end up pointing at a failed upload.
 *
 * The same component serves both roles; the API builds the storage key from
 * the caller's own id, so neither can write into the other's folder.
 */
export function PictureUpload({
  who,
  url,
  label,
}: {
  who: 'retailer' | 'brand'
  url: string | null
  label: string
}) {
  const router = useRouter()
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(url)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)

    // Checked locally first so an oversized file is refused instantly rather
    // than after a round-trip. The API enforces the same limits regardless.
    if (!ACCEPTED.includes(file.type)) {
      setError(t('picture.badType'))
      return
    }
    if (file.size > MAX_BYTES) {
      setError(t('picture.tooLarge'))
      return
    }

    startTransition(async () => {
      const signed = await requestPictureUpload(who, file.type, file.size)
      if (!signed.ok) {
        setError(signed.error)
        return
      }

      const put = await fetch(signed.data.uploadUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type },
        body: file,
      })
      if (!put.ok) {
        setError(t('picture.failed'))
        return
      }

      const confirmed = await confirmPictureUpload(who, signed.data.storageKey)
      if (!confirmed.ok) {
        setError(confirmed.error)
        return
      }

      setPreview(confirmed.data.logoUrl)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
        {preview ? (
          <Image
            src={preview}
            alt={label}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <ImageUp className="size-6" />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-9 w-fit items-center gap-2 rounded-[9px] border border-border px-3 text-sm font-medium disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {t(preview ? 'picture.change' : 'picture.upload')}
        </button>
        <span className="text-xs text-muted-foreground">
          {t('picture.limits')}
        </span>
        {error ? (
          <span role="alert" className="text-xs text-destructive">
            {error}
          </span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={onPick}
        className="hidden"
      />
    </div>
  )
}
