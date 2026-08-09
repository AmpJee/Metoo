'use client'

import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import {
  lineTotalMinor,
  quickPickQuantities,
  savingsMinor,
  unitPriceMinor,
  type PriceTier,
} from '@metoo/shared'
import { useState, useTransition } from 'react'
import { addToCart } from '@/app/actions/cart'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import {
  amountToFreeShippingMinor,
  parcelWeightGrams,
  shippingFeeMinor,
} from '@metoo/shared'
import { formatBaht } from '@/lib/format'
import { loginHref } from '@/lib/portals'
import { cn } from '@/lib/utils'

/**
 * Quantity stepper + add to cart.
 *
 * Steps by ONE pack, starting at the MOQ. The only rule the API enforces is
 * `packs >= minPacks` — see `checkQuantity` in the backend's domain layer,
 * whose comment records that an exact-multiple rule was deliberately removed
 * because it would reject 6 packs of a 5-unit product. Stepping by `minPacks`
 * would reimpose a constraint that does not exist.
 */
export function AddToCart({
  productId,
  minPacks,
  pricePerPackMinor,
  priceTiers = [],
  packPresets = [],
  packWeightGrams,
  stockPacks,
  disabled,
}: {
  productId: string
  minPacks: number
  pricePerPackMinor: number
  /** Grams per pack. Null when the seller has not recorded it. */
  packWeightGrams?: number | null
  /** Volume pricing. Empty for a product priced flat. */
  priceTiers?: PriceTier[]
  /** The "Amount" quick-picks, in display order. */
  packPresets?: number[]
  stockPacks: number | null
  disabled?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useT()
  const [packs, setPacks] = useState(minPacks)
  const unit = unitPriceMinor(pricePerPackMinor, priceTiers, packs)
  const lineTotal = lineTotalMinor(pricePerPackMinor, priceTiers, packs)
  const saved = savingsMinor(pricePerPackMinor, priceTiers, packs)

  // What delivery would cost if this were the whole order from this brand.
  // An estimate, and labelled as one: adding more of the same brand's goods
  // can push the parcel into the next weight band, or past the free
  // threshold. Same function checkout runs, so it cannot drift from the bill.
  const shipping = shippingFeeMinor({
    weightGrams: parcelWeightGrams([
      { packWeightGrams: packWeightGrams ?? null, packs },
    ]),
    subtotalMinor: lineTotal,
  })
  const toFree = amountToFreeShippingMinor(lineTotal)
  // Derived from the ladder, not from a second list the seller has to keep in
  // step with it: every price break gets a button, so a discount at 12 is one
  // tap away instead of something a buyer has to find by typing.
  //
  // Anything above the stock on hand is dropped rather than shown disabled — a
  // button that cannot be pressed is a worse answer than no button.
  const presets = quickPickQuantities(minPacks, priceTiers, packPresets).filter(
    (n) => stockPacks === null || n <= stockPacks
  )
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  const max = stockPacks ?? Infinity
  const canDecrease = packs > minPacks
  const canIncrease = packs < max

  return (
    <div className="flex flex-col gap-4">
      {presets.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('product.amount')}</span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={packs === preset}
                disabled={pending}
                onClick={() => setPacks(preset)}
                className={cn(
                  'h-11 min-w-[64px] rounded-[9px] border px-4 text-sm font-medium transition-colors',
                  packs === preset
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-primary/40 hover:border-primary'
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg border border-neutral-line">
          <button
            type="button"
            aria-label={t('product.decreaseQuantity')}
            disabled={!canDecrease || pending}
            onClick={() => setPacks((n) => Math.max(minPacks, n - 1))}
            className="flex size-10 items-center justify-center disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-14 text-center text-sm font-medium tabular-nums">
            {packs}
          </span>
          <button
            type="button"
            aria-label={t('product.increaseQuantity')}
            disabled={!canIncrease || pending}
            onClick={() => setPacks((n) => Math.min(max, n + 1))}
            className="flex size-10 items-center justify-center disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {/* Priced through the same function checkout uses, so this figure
            and the invoice cannot disagree. */}
        <div className="text-sm text-muted-foreground">
          <span className="text-lg font-bold text-primary">
            {formatBaht(lineTotal)}
          </span>
          <span className="mt-0.5 block">
            {t('product.unitBreakdown', {
              n: packs,
              price: formatBaht(unit),
            })}
            {saved > 0 ? (
              <span className="text-success">
                {' · '}
                {t('product.saves', { amount: formatBaht(saved) })}
              </span>
            ) : null}
          </span>
          <span className="mt-1 block">
            {shipping === 0
              ? t('product.shippingFree')
              : t('product.shippingEstimate', {
                  amount: formatBaht(shipping),
                })}
          </span>
          {toFree > 0 ? (
            <span className="block text-xs">
              {t('product.shippingToFree', { amount: formatBaht(toFree) })}
            </span>
          ) : null}
        </div>
      </div>

      {/* The MOQ is real; the "multiples" rule never was. */}
      {minPacks > 1 ? (
        <p className="text-xs text-muted-foreground">
          {t('product.minimumOrder', { n: minPacks })}
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
              // A visitor browsing the public catalog has just reached the
              // point where an account starts to matter. Send them to sign in
              // and back here, rather than showing them an error for it.
              if (result.signInRequired) {
                router.push(loginHref(pathname))
                return
              }
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
        {disabled ? t('product.unavailable') : t('product.addToCart')}
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
          {t('product.addedToCart')}
        </p>
      ) : null}
    </div>
  )
}
