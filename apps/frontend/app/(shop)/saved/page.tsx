import { Bookmark, Heart } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { SaveToggle } from '@/components/save-toggle'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import type { SavedProduct } from '@/lib/types'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Saved' }

const TABS = [
  { key: 'favourites', label: 'Favorite', path: '/favourites' },
  { key: 'saved', label: 'Saved for Later', path: '/saved-for-later' },
] as const

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabKey } = await searchParams
  const tab = TABS.find((item) => item.key === tabKey) ?? TABS[0]

  // Two separate lists on the API, not one with a flag — so the tab picks
  // the path rather than a query parameter.
  const items = await api.get<SavedProduct[]>(tab.path)

  const isFavourites = tab.key === 'favourites'

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-[20px] font-bold md:text-[36px]">Saved</h1>

      <nav className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={
              item.key === 'favourites' ? '/saved' : `/saved?tab=${item.key}`
            }
            className={cn(
              'border-b-2 px-4 py-3 text-sm transition-colors',
              item.key === tab.key
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            icon={isFavourites ? Heart : Bookmark}
            title={
              isFavourites ? 'No favorites yet' : 'Nothing saved for later'
            }
            description={
              isFavourites
                ? 'Tap the heart on a product to keep it here.'
                : 'Save products you are not ready to order yet.'
            }
            action={{ label: 'Start shopping', href: '/explore' }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-[16px] gap-y-[32px] md:grid-cols-4 md:gap-x-[26px]">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                action={
                  <SaveToggle
                    productId={product.id}
                    kind={isFavourites ? 'FAVOURITE' : 'SAVED_FOR_LATER'}
                    initial
                  />
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
