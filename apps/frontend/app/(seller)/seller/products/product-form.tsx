'use client'

import { CATEGORIES } from '@metoo/shared'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type ProductInput,
} from '@/app/actions/seller'
import { CButton } from '@/components/console/button'
import { CField, CSelect, CTextarea } from '@/components/console/field'
import { CInput } from '@/components/console/field'
import { useT } from '@/components/i18n-provider'
import { TierPricing } from './tier-pricing'
import type { BrandProduct } from '@/lib/types'

/**
 * Create or edit a product.
 *
 * Prices are entered in baht and sent as satang. The conversion happens once,
 * here, at the boundary — everything downstream stays in integer minor units,
 * which is what keeps commission arithmetic exact.
 */
export function ProductForm({ product }: { product?: BrandProduct }) {
  // null while the ladder is invalid, so the form can refuse to submit a
  // price the API would reject anyway.
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState<string | null>(null)
  const [tiers, setTiers] = useState<{
    pricePerPackMinor: number
    priceTiers: { minPacks: number; pricePerPackMinor: number }[]
  } | null>({
    pricePerPackMinor: product?.pricePerPackMinor ?? 0,
    priceTiers: product?.priceTiers ?? [],
  })
  // Held here rather than left to the uncontrolled input, because the tier
  // editor below needs it live: its first band IS the minimum order, and it
  // used to read a value fixed at mount, so a seller had to save and reopen
  // the form before the ladder caught up with the number they had just typed.
  const [minPacksText, setMinPacksText] = useState(
    String(product?.minPacks ?? 1)
  )
  // An empty or half-typed field is not a minimum of zero; one pack is the
  // smallest order that means anything, and the input's own `min` agrees.
  const minPacks = Math.max(1, Math.floor(Number(minPacksText)) || 1)
  const [pending, startTransition] = useTransition()

  const editing = Boolean(product)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = new FormData(event.currentTarget)
    const baht = Number(form.get('priceBaht'))
    const stock = String(form.get('stockPacks') ?? '').trim()

    if (!Number.isFinite(baht) || baht <= 0) {
      setError(t('productForm.badPrice'))
      return
    }

    if (tiers === null) {
      setError(t('productForm.badTiers'))
      return
    }

    const input: ProductInput = {
      name: String(form.get('name')),
      description: String(form.get('description') ?? '').trim() || undefined,
      // Round rather than truncate: 45.005 baht should not silently lose a
      // satang, and the API rejects a non-integer outright.
      //
      // The tier editor owns the base price when a ladder is set, since its
      // first band IS that price — two inputs for one number would let them
      // disagree.
      pricePerPackMinor: tiers.priceTiers.length
        ? tiers.pricePerPackMinor
        : Math.round(baht * 100),
      priceTiers: tiers.priceTiers,
      minPacks,
      unitsPerPack: Number(form.get('unitsPerPack')),
      category: String(form.get('category')),
      // Omitted, not zero — "made to order" and "none left" are different.
      stockPacks: stock === '' ? undefined : Number(stock),
      isActive: form.get('isActive') === 'on',
    }

    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id, input)
        : await createProduct(input)

      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push('/seller/products')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-[640px] flex-col gap-5">
      <CField label={t('productForm.name')}>
        <CInput
          name="name"
          required
          maxLength={200}
          defaultValue={product?.name}
        />
      </CField>

      <CField label={t('productForm.description')}>
        <CTextarea
          name="description"
          maxLength={2000}
          placeholder={t('productForm.descriptionPlaceholder')}
          defaultValue={product?.description ?? ''}
        />
      </CField>

      <CField label={t('productForm.category')}>
        <CSelect name="category" required defaultValue={product?.category}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(`category.${category}`)}
            </option>
          ))}
        </CSelect>
      </CField>

      <div className="grid gap-5 sm:grid-cols-2">
        <CField
          label={t('productForm.price')}
          hint={t('productForm.priceHint')}
        >
          <CInput
            name="priceBaht"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={
              product ? (product.pricePerPackMinor / 100).toFixed(2) : ''
            }
          />
        </CField>

        <CField label={t('productForm.unitsPerPack')}>
          <CInput
            name="unitsPerPack"
            type="number"
            min="1"
            required
            defaultValue={product?.unitsPerPack ?? 1}
          />
        </CField>

        {/* The old hint said orders must be a multiple of this. They must not:
            `checkQuantity` in the backend's domain layer enforces only
            `packs >= minPacks`, and its comment records that the multiples
            rule was deliberately removed. Corrected while translating. */}
        <CField
          label={t('productForm.minPacks')}
          hint={t('productForm.minPacksHint')}
        >
          <CInput
            name="minPacks"
            type="number"
            min="1"
            required
            value={minPacksText}
            onChange={(event) => setMinPacksText(event.target.value)}
          />
        </CField>

        <CField
          label={t('productForm.stock')}
          hint={t('productForm.stockHint')}
        >
          <CInput
            name="stockPacks"
            type="number"
            min="0"
            defaultValue={product?.stockPacks ?? ''}
          />
        </CField>
      </div>

      <TierPricing
        basePriceMinor={product?.pricePerPackMinor ?? 0}
        minPacks={minPacks}
        tiers={product?.priceTiers ?? []}
        onChange={setTiers}
      />

      <label className="flex items-center gap-2 text-[15px]">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={product?.isActive ?? true}
          className="size-4"
        />
        {t('productForm.visible')}
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-[#d4183d]/10 px-3 py-2 text-[15px] text-[#d4183d]"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <CButton type="submit" size="wide" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {t(editing ? 'productForm.save' : 'productForm.create')}
        </CButton>

        {product ? (
          <CButton
            type="button"
            variant="ghost"
            className="text-[#d4183d] hover:text-[#d4183d]"
            disabled={pending}
            onClick={() => {
              if (
                !window.confirm(
                  t('productForm.deleteAsk', { name: product.name })
                )
              ) {
                return
              }
              startTransition(async () => {
                const result = await deleteProduct(product.id)
                if (!result.ok) {
                  setError(result.error)
                  return
                }
                router.push('/seller/products')
                router.refresh()
              })
            }}
          >
            <Trash2 className="size-4" /> {t('productForm.delete')}
          </CButton>
        ) : null}
      </div>
    </form>
  )
}
