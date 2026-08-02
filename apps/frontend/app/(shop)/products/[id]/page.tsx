import { CATEGORY_LABELS } from '@metoo/shared'
import { MapPin, Star } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AddToCart } from '@/components/add-to-cart'
import { SaveToggle } from '@/components/save-toggle'
import { Badge } from '@/components/ui/badge'
import { ApiError, api } from '@/lib/api'
import { formatBaht, formatPackSummary } from '@/lib/format'
import type { CatalogProduct, SavedStatus } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const product = await api.get<CatalogProduct>(`/catalog/products/${id}`)
    return { title: product.name }
  } catch {
    return { title: 'Product' }
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let product: CatalogProduct
  try {
    product = await api.get<CatalogProduct>(`/catalog/products/${id}`)
  } catch (error) {
    // The API returns 404 for an inactive product or an unapproved brand,
    // identically to one that never existed — mirror that here.
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  // One call gives both list flags, so the icons render in the right state.
  let saved: SavedStatus = { favourite: false, savedForLater: false }
  try {
    saved = await api.get<SavedStatus>(`/products/${id}/saved`)
  } catch {
    // Non-fatal: the toggles just start unfilled.
  }

  const outOfStock = product.stockPacks === 0

  return (
    <div className="container-page py-8 md:py-12">
      <div className="grid gap-8 md:grid-cols-2 md:gap-[50px]">
        <div className="relative aspect-square w-full overflow-hidden rounded-[9px] bg-secondary">
          {product.photoUrl ? (
            <Image
              src={product.photoUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              No photo
            </div>
          )}

          <div className="absolute top-[15px] right-[15px] flex items-center gap-[10px]">
            <SaveToggle
              productId={product.id}
              kind="FAVOURITE"
              initial={saved.favourite}
            />
            <SaveToggle
              productId={product.id}
              kind="SAVED_FOR_LATER"
              initial={saved.savedForLater}
            />
          </div>
        </div>

        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-2">
            <Badge tone="primary" className="w-fit">
              {CATEGORY_LABELS[product.category]}
            </Badge>

            <h1 className="text-[20px] font-bold md:text-[36px]">
              {product.name}
            </h1>

            <Link
              href={`/stores/${product.brand.id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              {product.brand.logoUrl ? (
                <Image
                  src={product.brand.logoUrl}
                  alt=""
                  width={24}
                  height={24}
                  className="size-6 rounded-full object-cover"
                />
              ) : null}
              {product.brand.name}
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {product.brand.province}
              </span>
            </Link>

            {product.rating.average !== null ? (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-4 fill-warning text-warning" />
                {product.rating.average.toFixed(1)}
                <span>({product.rating.count} reviews)</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            )}
          </div>

          <div className="flex flex-col gap-1 border-y border-border py-4">
            <p className="text-[24px] font-bold text-primary md:text-[32px]">
              {formatBaht(product.pricePerPackMinor)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                per pack
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {formatPackSummary(product.unitsPerPack, product.minPacks)}
            </p>
            <p className="text-sm text-muted-foreground">
              Stock:{' '}
              {product.stockPacks === null
                ? 'Made to order'
                : `${product.stockPacks} packs`}
            </p>
          </div>

          <AddToCart
            productId={product.id}
            minPacks={product.minPacks}
            pricePerPackMinor={product.pricePerPackMinor}
            stockPacks={product.stockPacks}
            disabled={outOfStock}
          />

          {product.description ? (
            <div className="flex flex-col gap-2 pt-4">
              <h2 className="text-base font-semibold">Description</h2>
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {product.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
