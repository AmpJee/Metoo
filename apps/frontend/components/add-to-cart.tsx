'use client'

import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { addToCart } from '@/app/actions/cart'
import { Button } from '@/components/ui/button'
import { formatBaht } from '@/lib/format'

/**
 * Quantity stepper + add to cart.
 *
 * Steps in whole packs starting at the MOQ, because the API rejects anything
 * below `minPacks` or off that multiple with a 422. Enforcing it in the
 * control means the shopper never has to discover the rule from an error.
 */
export function AddToCart({
  productId,
  minPacks,
  pricePerPackMinor,
  stockPacks,
  disabled,
}: {
  productId: string
  minPacks: number
  pricePerPackMinor: number
  stockPacks: number | null
  disabled?: boolean
}) {
  const router = useRouter()
  const [packs, setPacks] = useState(minPacks)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  const max = stockPacks ?? Infinity
  const canDecrease = packs - minPacks >= minPacks
  const canIncrease = packs + minPacks <= max

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg border border-neutral-line">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={!canDecrease || pending}
            onClick={() => setPacks((n) => n - minPacks)}
            className="flex size-10 items-center justify-center disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-14 text-center text-sm font-medium tabular-nums">
            {packs}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={!canIncrease || pending}
            onClick={() => setPacks((n) => n + minPacks)}
            className="flex size-10 items-center justify-center disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div className="text-sm text-muted-foreground">
          {packs} {packs === 1 ? 'pack' : 'packs'} ·{' '}
          <span className="font-semibold text-foreground">
            {formatBaht(packs * pricePerPackMinor)}
          </span>
        </div>
      </div>

      {minPacks > 1 ? (
        <p className="text-xs text-muted-foreground">
          Sold in multiples of {minPacks} packs.
        </p>
      ) : null}

      <Button
        size="lg"
        disabled={disabled || pending}
        onClick={() => {
          setError(null)
          setDone(false)
          startTransition(async () => {
            const result = await addToCart(productId, packs)
            if (!result.ok) {
              setError(result.error)
              return
            }
            setDone(true)
            // The header cart badge is server-rendered in the shop layout.
            router.refresh()
          })
        }}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ShoppingCart className="size-4" />
        )}
        {disabled ? 'Unavailable' : 'Add to Cart'}
      </Button>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {done && !error ? (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          Added to your cart.
        </p>
      ) : null}
    </div>
  )
}
