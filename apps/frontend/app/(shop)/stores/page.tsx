import { MapPin, Star, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { getT } from '@/lib/i18n/server'
import type { Translate } from '@/lib/i18n'
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
    api.get<BrandListItem[]>('/catalog/brands'),
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

// `t` is threaded in rather than fetched again: this renders once per brand,
// and a cookie read per tile is a needless cost for a value the page already
// has.
function BrandTile({
  brand,
  following,
  t,
}: {
  brand: {
    id: string
    name: string
    logoUrl: string | null
    province: string
  } & {
    rating?: { average: number | null; count: number }
  }
  following?: boolean
  t: Translate
}) {
  return (
    <Link
      href={`/stores/${brand.id}`}
      className="flex flex-col items-center gap-3 rounded-[9px] border border-border p-6 text-center transition-colors hover:border-primary"
    >
      <div className="relative size-[60px] shrink-0 overflow-hidden rounded-full bg-secondary">
        {brand.logoUrl ? (
          <Image
            src={brand.logoUrl}
            alt=""
            fill
            sizes="60px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground">
            {brand.name.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{brand.name}</p>
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          {brand.province}
        </p>
        {brand.rating && brand.rating.average !== null ? (
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-warning text-warning" />
            {brand.rating.average.toFixed(1)} ({brand.rating.count})
          </p>
        ) : null}
        {following ? (
          <span className="text-xs font-medium text-primary">
            {t('stores.isFollowing')}
          </span>
        ) : null}
      </div>
    </Link>
  )
}
