import { MapPin, PackageSearch, Star } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { FollowButton } from '@/components/follow-button'
import { ProductCard } from '@/components/product-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ApiError, api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import type { Storefront } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brandId: string }>
}): Promise<Metadata> {
  const { brandId } = await params
  try {
    const store = await api.get<Storefront>(`/stores/${brandId}`)
    return { title: store.name }
  } catch {
    return { title: 'Store' }
  }
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ brandId: string }>
}) {
  const { brandId } = await params

  let store: Storefront
  try {
    store = await api.get<Storefront>(`/stores/${brandId}`)
  } catch (error) {
    // A brand that is not ONBOARDED 404s exactly like one that does not exist.
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  return (
    <div className="container-page py-8 md:py-12">
      <header className="flex flex-col gap-[16px] border-b border-border pb-8 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative size-[60px] shrink-0 overflow-hidden rounded-full bg-secondary md:size-[80px]">
            {store.logoUrl ? (
              <Image
                src={store.logoUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                {store.name.charAt(0)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] font-bold md:text-[36px]">
              {store.name}
            </h1>
            <p className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {store.province}
              </span>
              {store.rating.average !== null ? (
                <span className="flex items-center gap-1">
                  <Star className="size-3 fill-warning text-warning" />
                  {store.rating.average.toFixed(1)} ({store.rating.count})
                </span>
              ) : null}
              <span>{store.productCount} products</span>
              <span>Member since {formatDate(store.memberSince)}</span>
            </p>
          </div>
        </div>

        {/* `following` is null for a viewer who is not a retailer — but this
            route group is retailer-only, so it is a boolean in practice. */}
        <FollowButton
          brandId={store.id}
          initialFollowing={store.following ?? false}
          initialCount={store.followerCount}
        />
      </header>

      {store.description ? (
        <p className="mt-6 max-w-[685px] text-sm text-muted-foreground">
          {store.description}
        </p>
      ) : null}

      <section className="mt-8">
        {store.products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No products listed"
            description="This brand has not published any products yet."
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-[16px] gap-y-[32px] md:grid-cols-4 md:gap-x-[26px]">
            {store.products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  brand: { id: store.id, name: store.name },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
