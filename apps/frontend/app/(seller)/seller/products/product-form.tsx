'use client'

import { CATEGORIES, CATEGORY_LABELS } from '@metoo/shared'
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
import type { BrandProduct } from '@/lib/types'

/**
 * Create or edit a product.
 *
 * Prices are entered in baht and sent as satang. The conversion happens once,
 * here, at the boundary — everything downstream stays in integer minor units,
 * which is what keeps commission arithmetic exact.
 */
export function ProductForm({ product }: { product?: BrandProduct }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const editing = Boolean(product)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = new FormData(event.currentTarget)
    const baht = Number(form.get('priceBaht'))
    const stock = String(form.get('stockPacks') ?? '').trim()

    if (!Number.isFinite(baht) || baht <= 0) {
      setError('Enter a price greater than zero.')
      return
    }

    const input: ProductInput = {
      name: String(form.get('name')),
      description: String(form.get('description') ?? '').trim() || undefined,
      // Round rather than truncate: 45.005 baht should not silently lose a
      // satang, and the API rejects a non-integer outright.
      pricePerPackMinor: Math.round(baht * 100),
      minPacks: Number(form.get('minPacks')),
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
      <CField label="Product name">
        <CInput
          name="name"
          required
          maxLength={200}
          defaultValue={product?.name}
        />
      </CField>

      <CField label="Description">
        <CTextarea
          name="description"
          maxLength={2000}
          placeholder="Describe your product..."
          defaultValue={product?.description ?? ''}
        />
      </CField>

      <CField label="Category">
        <CSelect name="category" required defaultValue={product?.category}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </CSelect>
      </CField>

      <div className="grid gap-5 sm:grid-cols-2">
        <CField
          label="Price per pack (฿)"
          hint="Wholesale price a retailer pays."
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

        <CField label="Units per pack">
          <CInput
            name="unitsPerPack"
            type="number"
            min="1"
            required
            defaultValue={product?.unitsPerPack ?? 1}
          />
        </CField>

        <CField
          label="Minimum order (packs)"
          hint="Orders must be a multiple of this."
        >
          <CInput
            name="minPacks"
            type="number"
            min="1"
            required
            defaultValue={product?.minPacks ?? 1}
          />
        </CField>

        <CField label="Stock (packs)" hint="Leave blank for made to order.">
          <CInput
            name="stockPacks"
            type="number"
            min="0"
            defaultValue={product?.stockPacks ?? ''}
          />
        </CField>
      </div>

      <label className="flex items-center gap-2 text-[15px]">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={product?.isActive ?? true}
          className="size-4"
        />
        Visible in the catalog
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
          {editing ? 'Save changes' : 'Create product'}
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
                  `Delete "${product.name}"? Past orders keep their own copy of the name and price, so history is unaffected.`
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
            <Trash2 className="size-4" /> Delete
          </CButton>
        ) : null}
      </div>
    </form>
  )
}
