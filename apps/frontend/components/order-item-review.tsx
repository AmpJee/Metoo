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
  const [open, setOpen] = useState(existing === null)
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
            <StarDisplay rating={existing?.rating ?? rating} />
            {existing?.comment ? (
              <span className="text-xs text-muted-foreground">
                “{existing.comment}”
              </span>
            ) : null}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          <Pencil className="mr-1 size-3" /> {t('review.edit')}
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
        {existing ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              // Revert to what is stored, not to empty — cancelling an edit
              // must not look like the review was cleared.
              setRating(existing.rating)
              setComment(existing.comment ?? '')
              setError(null)
              setOpen(false)
            }}
          >
            {t('common.cancel')}
          </Button>
        ) : null}
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
