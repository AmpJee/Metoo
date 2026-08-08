'use client'

import {
  MAX_TIERS,
  checkPriceTiers,
  lineTotalMinor,
  unitPriceMinor,
} from '@metoo/shared'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useT } from '@/components/i18n-provider'
import { Input } from '@/components/ui/input'
import { formatBaht } from '@/lib/format'
import {
  addBand,
  fromBands,
  rebaseBands,
  removeBand,
  setBandEnd,
  setBandStart,
  toBands,
  type Band,
} from '@/lib/tier-bands'
import type { MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * Failure codes to message keys, spelled out rather than interpolated.
 *
 * A template-literal key would typecheck against anything and silently render
 * the raw code the day the domain layer adds a rule. Listed here, a new code
 * fails the build until someone writes the sentence a seller reads.
 */
const TIER_ERRORS: Record<string, MessageKey> = {
  TIERS_TOO_MANY: 'tiers.error.TIERS_TOO_MANY',
  TIER_BAD_QUANTITY: 'tiers.error.TIER_BAD_QUANTITY',
  TIER_BAD_PRICE: 'tiers.error.TIER_BAD_PRICE',
  TIER_BELOW_MINIMUM: 'tiers.error.TIER_BELOW_MINIMUM',
  TIERS_NOT_ASCENDING: 'tiers.error.TIERS_NOT_ASCENDING',
  TIERS_NOT_CHEAPER: 'tiers.error.TIERS_NOT_CHEAPER',
  TIER_NOT_A_DISCOUNT: 'tiers.error.TIER_NOT_A_DISCOUNT',
}

/**
 * The volume pricing editor.
 *
 * Bands rather than thresholds: a seller thinks "12 to 47 costs ฿635", not
 * "there is a price break at 12". The `to` of one band and the `from` of the
 * next are the same boundary shown twice, so editing either moves both.
 *
 * The first band is the product's own price, not a stored tier. That is what
 * lets the ladder read as one table instead of "the price, and separately
 * some discounts" — and it is why the first row's quantity is fixed at the
 * minimum order and its bin is missing.
 *
 * Prices are entered in baht and held in satang. Money never touches a float
 * here: `Math.round(baht * 100)` on the way in, formatBaht on the way out.
 */
export function TierPricing({
  basePriceMinor,
  minPacks,
  tiers,
  onChange,
}: {
  basePriceMinor: number
  minPacks: number
  tiers: { minPacks: number; pricePerPackMinor: number }[]
  /** Fires with the shape the API stores, or null while the ladder is invalid. */
  onChange: (
    value: { pricePerPackMinor: number; priceTiers: typeof tiers } | null
  ) => void
}) {
  const t = useT()
  const [bands, setBands] = useState<Band[]>(() =>
    toBands(basePriceMinor, minPacks, tiers)
  )

  // The minimum order lives in a field above this one, and the first band IS
  // that minimum — so when it changes, the ladder has to follow. Adjusted
  // during render rather than in an effect: an effect would paint the stale
  // ladder for a frame first, and the seller is looking straight at it.
  const [builtFor, setBuiltFor] = useState(minPacks)
  if (builtFor !== minPacks) {
    setBuiltFor(minPacks)
    setBands((current) => rebaseBands(current, minPacks))
  }

  // What a retailer ordering this many would pay — the question a seller is
  // actually asking while they type.
  const [preview, setPreview] = useState(() => Math.max(minPacks, 1) * 2)

  const { pricePerPackMinor, priceTiers } = fromBands(bands)
  const check = checkPriceTiers(priceTiers, pricePerPackMinor, minPacks)

  // One place decides what the form gets, so a ladder invalidated by a change
  // to the minimum order reports itself the same way as one the seller broke
  // by typing — `apply` used to own this, and a rebase went unreported.
  useEffect(() => {
    const shaped = fromBands(bands)
    const valid = checkPriceTiers(
      shaped.priceTiers,
      shaped.pricePerPackMinor,
      minPacks
    )
    onChange(valid.ok ? shaped : null)
  }, [bands, minPacks, onChange])

  const apply = (next: Band[]) => setBands(next)

  const setPrice = (index: number, baht: number) =>
    apply(
      bands.map((band, i) =>
        i === index
          ? { ...band, pricePerPackMinor: Math.round(baht * 100) }
          : band
      )
    )

  const previewUnit = unitPriceMinor(pricePerPackMinor, priceTiers, preview)
  const previewTotal = lineTotalMinor(pricePerPackMinor, priceTiers, preview)

  return (
    <div className="flex flex-col gap-4 rounded-[9px] border border-border bg-secondary/30 p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-[15px] font-semibold">{t('tiers.title')}</h3>
        <p className="text-[13px] text-muted-foreground">{t('tiers.hint')}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-2 font-normal">{t('tiers.appliesTo')}</th>
              <th className="pb-2 font-normal">{t('tiers.pricePerUnit')}</th>
              <th className="pb-2 font-normal">{t('tiers.rangeTotal')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {bands.map((band, index) => (
              <tr key={index}>
                <td className="py-1 pr-3">
                  <span className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={band.from}
                      // The first band starts at the product's minimum order;
                      // there is nothing below it to move.
                      disabled={index === 0}
                      onChange={(e) =>
                        apply(
                          setBandStart(bands, index, Number(e.target.value))
                        )
                      }
                      className="w-[86px]"
                      aria-label={t('tiers.from')}
                    />
                    <span className="text-muted-foreground">
                      {t('tiers.to')}
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={band.to ?? ''}
                      placeholder={t('tiers.noLimit')}
                      // The top band has no end — that is what makes it cover
                      // every larger order.
                      disabled={index === bands.length - 1}
                      onChange={(e) =>
                        apply(setBandEnd(bands, index, Number(e.target.value)))
                      }
                      className="w-[100px]"
                      aria-label={t('tiers.to')}
                    />
                  </span>
                </td>
                <td className="py-1 pr-3">
                  <Input
                    type="number"
                    min={1}
                    step="0.01"
                    value={band.pricePerPackMinor / 100}
                    onChange={(e) => setPrice(index, Number(e.target.value))}
                    className="w-[110px]"
                    aria-label={t('tiers.pricePerUnit')}
                  />
                </td>
                <td className="py-1 pr-3 text-muted-foreground">
                  {band.to === null
                    ? t('tiers.openBand', {
                        from: band.from,
                        price: formatBaht(band.pricePerPackMinor),
                      })
                    : t('tiers.closedBand', {
                        from: band.from,
                        to: band.to,
                        total: formatBaht(band.pricePerPackMinor * band.to),
                      })}
                </td>
                <td className="py-1">
                  {index > 0 ? (
                    <button
                      type="button"
                      onClick={() => apply(removeBand(bands, index))}
                      aria-label={t('tiers.remove')}
                      className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[13px] text-muted-foreground">
        {t('tiers.openEndedHint')}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={bands.length > MAX_TIERS}
          onClick={() => apply(addBand(bands))}
          className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-primary px-3 text-[13px] font-medium text-primary disabled:opacity-50"
        >
          <Plus className="size-4" /> {t('tiers.add')}
        </button>
        <button
          type="button"
          onClick={() => apply(toBands(basePriceMinor, minPacks, tiers))}
          className="inline-flex h-9 items-center gap-1.5 rounded-[9px] px-2 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5" /> {t('tiers.reset')}
        </button>
      </div>

      {/* The seller's real question, answered as they type. Uses the same
          function checkout uses, so this cannot promise a price the invoice
          does not honour. */}
      <div className="border-t border-border pt-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted-foreground">
            {t('tiers.previewLabel')}
          </span>
          <Input
            type="number"
            min={1}
            value={preview}
            onChange={(e) => setPreview(Math.max(1, Number(e.target.value)))}
            className="max-w-[240px]"
          />
        </label>
        <p className="mt-2 text-[13px] text-muted-foreground">
          {t('tiers.previewPays')}{' '}
          <strong className="text-primary">
            {t('tiers.perUnit', { price: formatBaht(previewUnit) })}
          </strong>{' '}
          · {formatBaht(previewTotal)} {t('tiers.previewTotal')}
        </p>
      </div>

      {!check.ok ? (
        <p
          role="alert"
          className={cn(
            'rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive'
          )}
        >
          {t(TIER_ERRORS[check.code] ?? 'common.somethingWentWrong')}
        </p>
      ) : null}
    </div>
  )
}
