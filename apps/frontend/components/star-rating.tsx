'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'
import { useT } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'

const STARS = [1, 2, 3, 4, 5]

/**
 * A five-star picker.
 *
 * Radio inputs rather than buttons, so the whole control is one form field, is
 * reachable by keyboard with arrow keys, and announces itself to a screen
 * reader as "3 of 5" instead of five unlabelled buttons. The stars are the
 * label; the input itself is visually hidden but never `display: none`, which
 * would take it out of the tab order.
 */
export function StarRating({
  value,
  onChange,
  name = 'rating',
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  name?: string
  disabled?: boolean
}) {
  const t = useT()
  const [hovered, setHovered] = useState(0)
  // Hover previews the score without committing it.
  const shown = hovered || value

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHovered(0)}
      role="radiogroup"
      aria-label={t('review.ratingGroup')}
    >
      {STARS.map((star) => (
        <label
          key={star}
          className={cn('cursor-pointer p-0.5', disabled && 'cursor-default')}
          onMouseEnter={() => !disabled && setHovered(star)}
        >
          <input
            type="radio"
            name={name}
            value={star}
            checked={value === star}
            disabled={disabled}
            onChange={() => onChange(star)}
            className="sr-only"
          />
          <Star
            className={cn(
              'size-6 transition-colors',
              star <= shown ? 'fill-warning text-warning' : 'text-neutral-line',
              !disabled && 'hover:scale-110'
            )}
          />
          <span className="sr-only">{t('review.stars', { n: star })}</span>
        </label>
      ))}
    </div>
  )
}

/** Read-only stars, for showing a score that was already given. */
export function StarDisplay({
  rating,
  className,
}: {
  rating: number
  className?: string
}) {
  const t = useT()

  return (
    <span
      className={cn('flex items-center gap-0.5', className)}
      aria-label={t('review.outOf', { n: rating })}
    >
      {STARS.map((star) => (
        <Star
          key={star}
          aria-hidden
          className={cn(
            'size-4',
            star <= rating ? 'fill-warning text-warning' : 'text-neutral-line'
          )}
        />
      ))}
    </span>
  )
}
