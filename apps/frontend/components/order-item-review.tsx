'use client'

import { Loader2, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { submitReview } from '@/app/actions/reviews'
import { useT } from '@/components/i18n-provider'
import { StarDisplay, StarRating } from '@/components/star-rating'
import { Button } from '@/components/ui/button'
import type { Review } from '@/lib/types'

/**
 * Rate one product from an order.
 *
 * Rendered per line item rather than per order: a retailer buys several
 * products from one brand in a single order, and a single rating for the whole
 * order could not say which of them was good.
 *
 * An existing review collapses to a summary with an Edit affordance — the API
 * treats a resubmission as a change of mind, so there is nothing to stop them,
 * but the default state should be "done", not an open form inviting a rewrite.
 *
 * An unreviewed product starts collapsed too, showing five empty stars. The
 * form used to open itself, which put a comment box and a Submit button in
 * front of every buyer who had merely opened their order — asking for a review
 * rather than offering one. Clicking a star is the invitation, and it carries
 * the score the buyer just picked straight into the open form.
 */
export function OrderItemReview({
  productId,
  productName,
  existing,
}: {
  productId: string
  productName: string
  existing: Review | null
}) {
  const router = useRouter()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const save = () => {
    if (rating === 0) {
      setError(t('review.pickStars'))
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await submitReview(productId, rating, comment)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{productName}</span>
          <span className="flex items-center gap-2">
            {existing ? (
              <StarDisplay rating={existing.rating} />
            ) : (
              // Live stars, not a display: the click that picks a score is
              // also what opens the form, so rating a product is one gesture
              // rather than "press Review, then rate".
              <StarRating
                value={rating}
                onChange={(picked) => {
                  setRating(picked)
                  setOpen(true)
                }}
                name={`rating-${productId}`}
              />
            )}
            {existing?.comment ? (
              <span className="text-xs text-muted-foreground">
                “{existing.comment}”
              </span>
            ) : null}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          <Pencil className="mr-1 size-3" />
          {t(existing ? 'review.edit' : 'review.write')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <span className="text-sm font-medium">{productName}</span>

      <StarRating
        value={rating}
        onChange={setRating}
        name={`rating-${productId}`}
        disabled={pending}
      />

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        disabled={pending}
        rows={2}
        maxLength={2000}
        placeholder={t('review.placeholder')}
        className="w-full rounded-[9px] border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
      />

      <div className="flex items-center gap-2">
        <Button size="sm" disabled={pending} onClick={save}>
          {pending ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
          {t(existing ? 'review.update' : 'review.submit')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            // Revert to what is stored, not to empty — cancelling an edit must
            // not look like the review was cleared. With nothing stored, back
            // to empty stars is exactly right.
            setRating(existing?.rating ?? 0)
            setComment(existing?.comment ?? '')
            setError(null)
            setOpen(false)
          }}
        >
          {t('common.cancel')}
        </Button>
      </div>

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
