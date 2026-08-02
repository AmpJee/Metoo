'use client'

import { ImageUp, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { confirmPhotoUpload, requestPhotoUpload } from '@/app/actions/seller'
import { CButton } from '@/components/console/button'

/** Matches MAX_PHOTO_BYTES on the API. */
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Two-step signed upload.
 *
 *   1. ask the API for a signed URL   (server action, our session)
 *   2. PUT the bytes to Supabase      (browser → storage, signed URL)
 *   3. confirm the key with the API   (server action)
 *
 * Step 2 goes straight from the browser so a 5 MB image never travels through
 * the Next server. Step 3 exists because the API verifies the object really
 * landed before recording it — a product cannot end up pointing at an upload
 * that failed halfway.
 */
export function PhotoUpload({
  productId,
  photoUrl,
}: {
  productId: string
  photoUrl: string | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(photoUrl)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)

    // Check locally first so an oversized file is refused instantly rather
    // than after a round-trip. The API enforces the same limits regardless.
    if (!ACCEPTED.includes(file.type)) {
      setError('Use a JPEG, PNG or WebP image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('That image is larger than 5 MB.')
      return
    }

    startTransition(async () => {
      const signed = await requestPhotoUpload(productId, file.type, file.size)
      if (!signed.ok) {
        setError(signed.error)
        return
      }

      const put = await fetch(signed.data.uploadUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type },
        body: file,
      }).catch(() => null)

      if (!put?.ok) {
        setError('The upload did not complete. Please try again.')
        return
      }

      const confirmed = await confirmPhotoUpload(
        productId,
        signed.data.storageKey
      )
      if (!confirmed.ok) {
        setError(confirmed.error)
        return
      }

      setPreview(confirmed.data.photoUrl)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-[9px] bg-[#f5f5f5]">
        {preview ? (
          <Image
            src={preview}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[13px] text-black/50">
            No photo
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          onChange={onPick}
          className="hidden"
        />
        <CButton
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImageUp className="size-4" />
          )}
          {preview ? 'Replace photo' : 'Upload photo'}
        </CButton>
        <p className="text-[13px] text-black/50">
          JPEG, PNG or WebP, up to 5 MB.
        </p>
        {error ? (
          <p role="alert" className="text-[13px] text-[#d4183d]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
