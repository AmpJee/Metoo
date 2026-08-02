'use client'

import { Loader2, Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { removeCartItem, updateCartItem } from '@/app/actions/cart'
import { Badge } from '@/components/ui/badge'
import { formatBaht, formatPackSummary } from '@/lib/format'
import type { CartItem } from '@/lib/types'

/**
 * One cart line.
 *
 * Quantity steps by `minPacks`, matching the API's MOQ and case-size rules —
 * the same constraint the product page enforces, so a cart can never hold a
 * quantity checkout would reject.
 */
export function CartLine({ item }: { item: CartItem }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const { product } = item
  const step = product.minPacks

  const change = (packs: number) => {
    setError(null)
    startTransition(async () => {
      const result = await updateCartItem(item.id, packs)
      if (!result.ok) setError(result.error)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-4 py-4">
      <Link
        href={`/products/${product.id}`}
        className="relative size-[80px] shrink-0 overflow-hidden rounded-[8px] bg-secondary md:size-[100px]"
      >
        {product.photoUrl ? (
          <Image
            src={product.photoUrl}
            alt={product.name}
            fill
            sizes="100px"
            className="object-cover"
          />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Link
              href={`/products/${product.id}`}
              className="text-sm font-medium hover:text-primary"
            >
              {product.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {formatPackSummary(product.unitsPerPack, product.minPacks)}
            </p>
            {/* A brand can retire a product after it is in a cart. Checkout
                re-validates every line, so flag it before that happens. */}
            {!product.isActive ? (
              <Badge tone="destructive" className="w-fit">
                No longer available — remove to check out
              </Badge>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Remove"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await removeCartItem(item.id)
                router.refresh()
              })
            }}
            className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center rounded-lg border border-neutral-line">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={pending || item.packs - step < step}
              onClick={() => change(item.packs - step)}
              className="flex size-8 items-center justify-center disabled:opacity-40"
            >
              <Minus className="size-3" />
            </button>
            <span className="w-10 text-center text-sm tabular-nums">
              {pending ? (
                <Loader2 className="mx-auto size-3 animate-spin" />
              ) : (
                item.packs
              )}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={pending}
              onClick={() => change(item.packs + step)}
              className="flex size-8 items-center justify-center disabled:opacity-40"
            >
              <Plus className="size-3" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold">
              {formatBaht(item.lineTotalMinor)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBaht(product.pricePerPackMinor)} / pack
            </p>
          </div>
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
    </div>
  )
}
