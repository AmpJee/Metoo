import { CATEGORIES } from '@metoo/shared'
import { PackageSearch } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BrandTile } from '@/components/brand-tile'
import { CategoryNav } from '@/components/category-nav'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { getT } from '@/lib/i18n/server'
import type { BrandListItem, CatalogPage, Category } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('explore.title') }
}

function isCategory(value: string | undefined): value is Category {
  return Boolean(value) && (CATEGORIES as readonly string[]).includes(value!)
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; cursor?: string }>
}) {
  const t = await getT()
  const { category, q, cursor } = await searchParams

  const params = new URLSearchParams()
  // Only forward a category the API will accept; an unknown value would 422.
  if (isCategory(category)) params.set('category', category)
  if (q) params.set('q', q)
  if (cursor) params.set('cursor', cursor)

  const query = params.toString()

  // Brands only when something was searched for. Browsing a category is not
  // asking about shops, and the Stores page already lists them all.
  const [page, brands] = await Promise.all([
    api.get<CatalogPage>(`/catalog/products${query ? `?${query}` : ''}`),
    q
      ? api
          .get<BrandListItem[]>(`/catalog/brands?q=${encodeURIComponent(q)}`)
          .catch(() => [] as BrandListItem[])
      : Promise.resolve([] as BrandListItem[]),
  ])

  const heading = isCategory(category)
    ? t(`category.${category}`)
    : q
      ? t('explore.results', { q })
      : t('explore.title')

  /** Preserve the current filters when paging forward. */
  const nextHref = () => {
    const next = new URLSearchParams(params)
    next.set('cursor', page.nextCursor!)
    return `/explore?${next.toString()}`
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex flex-col gap-[16px]">
        <h1 className="text-[20px] font-bold md:text-[36px]">{heading}</h1>
        <CategoryNav
          active={isCategory(category) ? category : undefined}
          q={q}
        />
      </div>

      {/* The shop itself, above its goods. Someone typing a brand name is
          looking for the shop; showing only its products makes them hunt for
          the door. */}
      {brands.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold">
            {t('explore.brandResults')}
          </h2>
          <div className="grid grid-cols-2 gap-[16px] md:grid-cols-4 md:gap-[26px]">
            {brands.map((brand) => (
              <BrandTile key={brand.id} brand={brand} t={t} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        {brands.length > 0 && page.items.length > 0 ? (
          <h2 className="mb-4 text-base font-semibold">
            {t('explore.productResults')}
          </h2>
        ) : null}
        {page.items.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={t('explore.emptyTitle')}
            description={
              q ? t('explore.emptySearch') : t('explore.emptyCategory')
            }
            action={{ label: t('explore.browseEverything'), href: '/explore' }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-[16px] gap-y-[32px] md:grid-cols-4 md:gap-x-[26px]">
            {page.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Cursor paging, matching the API: a null nextCursor is the last page. */}
      {page.nextCursor ? (
        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href={nextHref()}>{t('explore.loadMore')}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
