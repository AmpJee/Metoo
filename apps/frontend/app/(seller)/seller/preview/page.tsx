import { MapPin, PackageSearch, Star } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { PageHeader } from '@/components/dashboard-shell'
import { ProductCard } from '@/components/product-card'
import { CardEmpty } from '@/components/console/card'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import type { Storefront } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('preview.title') }
}

/**
 * The seller's own store, exactly as a buyer sees it.
 *
 * `/brand/storefront` returns the identical shape as `/stores/:brandId` from
 * the same code path, so this reuses the buyer's ProductCard rather than a
 * near-copy that could drift.
 */
export default async function StorePreviewPage() {
  const t = await getT()
  const locale = await getLocale()
  const store = await api.get<Storefront>('/brand/storefront')

  return (
    <>
      <PageHeader
        title={t('preview.title')}
        description={t('preview.subtitle')}
      />

      <div>
        <div className="rounded-[9px] bg-white p-6">
          <header className="flex flex-col gap-4 border-b border-black/10 pb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative size-[60px] shrink-0 overflow-hidden rounded-full bg-[#f5f5f5] md:size-[80px]">
                {store.logoUrl ? (
                  <Image
                    src={store.logoUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-2xl font-semibold text-black/50">
                    {store.name.charAt(0)}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-[20px] font-bold md:text-[28px]">
                  {store.name}
                </h2>
                <p className="flex flex-wrap items-center gap-3 text-[15px] text-black/50">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {store.province}
                  </span>
                  {store.rating.average !== null ? (
                    <span className="flex items-center gap-1">
                      <Star className="size-3 fill-warning text-[#c47f00]" />
                      {store.rating.average.toFixed(1)} ({store.rating.count})
                    </span>
                  ) : (
                    <span>{t('preview.noReviews')}</span>
                  )}
                  <span>
                    {t('preview.followers', { n: store.followerCount })}
                  </span>
                  <span>
                    {t('preview.memberSince', {
                      date: formatDate(store.memberSince, locale),
                    })}
                  </span>
                </p>
              </div>
            </div>
          </header>

          {store.description ? (
            <p className="mt-6 max-w-[685px] text-[15px] text-black/50">
              {store.description}
            </p>
          ) : null}

          <div className="mt-6">
            {store.products.length === 0 ? (
              <CardEmpty
                icon={PackageSearch}
                title={t('preview.emptyTitle')}
                description={t('preview.emptyBody')}
                action={{
                  label: t('preview.addProduct'),
                  href: '/seller/products/new',
                }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-x-[16px] gap-y-[32px] md:grid-cols-4 md:gap-x-[26px]">
                {store.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
