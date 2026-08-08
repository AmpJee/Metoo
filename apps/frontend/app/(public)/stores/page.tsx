import { Store } from 'lucide-react'
import type { Metadata } from 'next'
import { BrandTile } from '@/components/brand-tile'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { getT } from '@/lib/i18n/server'
import type { BrandListItem, FollowedBrand } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('stores.title') }
}

export default async function StoresPage() {
  const t = await getT()

  // Brands come from the catalog, not GET /stores — that route is the brand's
  // own preview of its storefront and is BRAND-only.
  const [brands, following] = await Promise.all([
    api.get<BrandListItem[]>('/catalog/brands', { optionalAuth: true }),
    api.get<FollowedBrand[]>('/following').catch(() => [] as FollowedBrand[]),
  ])

  const followedIds = new Set(following.map((brand) => brand.id))

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-[20px] font-bold md:text-[36px]">
        {t('stores.title')}
      </h1>

      {following.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold">
            {t('stores.following')}
          </h2>
          <div className="grid grid-cols-2 gap-[16px] md:grid-cols-4 md:gap-[26px]">
            {following.map((brand) => (
              <BrandTile key={brand.id} brand={brand} following t={t} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-4 text-base font-semibold">{t('stores.all')}</h2>
        {brands.length === 0 ? (
          <EmptyState
            icon={Store}
            title={t('stores.emptyTitle')}
            description={t('stores.emptyBody')}
          />
        ) : (
          <div className="grid grid-cols-2 gap-[16px] md:grid-cols-4 md:gap-[26px]">
            {brands.map((brand) => (
              <BrandTile
                key={brand.id}
                brand={brand}
                following={followedIds.has(brand.id)}
                t={t}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
