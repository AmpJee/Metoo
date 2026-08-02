'use client'

import { Bookmark, Heart } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toggleSaved } from '@/app/actions/saved'
import type { SavedKind } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Favourite / save-for-later toggle.
 *
 * Optimistic: the icon flips immediately and reverts if the server disagrees.
 * A heart that lags a round-trip feels broken even when it works.
 */
export function SaveToggle({
  productId,
  kind,
  initial,
  className,
}: {
  productId: string
  kind: SavedKind
  initial: boolean
  className?: string
}) {
  const [saved, setSaved] = useState(initial)
  const [pending, startTransition] = useTransition()

  const Icon = kind === 'FAVOURITE' ? Heart : Bookmark
  const label = kind === 'FAVOURITE' ? 'favorites' : 'saved'

  return (
    <button
      type="button"
      aria-label={saved ? `Remove from ${label}` : `Add to ${label}`}
      aria-pressed={saved}
      disabled={pending}
      onClick={() => {
        const previous = saved
        setSaved(!previous)
        startTransition(async () => {
          const result = await toggleSaved(productId, kind, previous)
          if (!result.ok) setSaved(previous)
          else setSaved(result.saved)
        })
      }}
      className={cn(
        'flex size-8 items-center justify-center rounded-full bg-background/90 text-neutral-dark shadow-sm transition-colors hover:text-primary disabled:opacity-60',
        saved && 'text-primary',
        className
      )}
    >
      <Icon className={cn('size-4', saved && 'fill-current')} />
    </button>
  )
}
