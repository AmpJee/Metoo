import { Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatBaht, formatPackSummary } from '@/lib/format'

/**
 * One product tile, shared by explore, storefront and saved.
 *
 * Radius and aspect follow the design (rounded-[9px], square image).
 */
export function ProductCard({
  product,
  action,
}: {
  product: {
    id: string
    name: string
    photoUrl: string | null
    pricePerPackMinor: number
    minPacks: number
    unitsPerPack: number
    stockPacks?: number | null
    isActive?: boolean
    rating?: { average: number | null; count: number }
    brand?: { id: string; name: string }
  }
  /** Slot for a favourite toggle or a remove button. */
  action?: React.ReactNode
}) {
  const outOfStock = product.stockPacks === 0
  const retired = product.isActive === false

  return (
    <div className="group relative flex flex-col gap-3">
      {action ? (
        <div className="absolute top-[15px] right-[15px] z-10 flex items-center gap-[10px]">
          {action}
        </div>
      ) : null}

      <Link
        href={`/products/${product.id}`}
        className="relative aspect-square w-full overflow-hidden rounded-[9px] bg-secondary transition-transform hover:scale-[1.02]"
      >
        {product.photoUrl ? (
          <Image
            src={product.photoUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            No photo
          </div>
        )}

        {retired || outOfStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Badge tone="outline">
              {retired ? 'No longer sold' : 'Out of stock'}
            </Badge>
          </div>
        ) : null}
      </Link>

      <div className="flex flex-col gap-1">
        {product.brand ? (
          <Link
            href={`/stores/${product.brand.id}`}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            {product.brand.name}
          </Link>
        ) : null}

        <Link
          href={`/products/${product.id}`}
          className="line-clamp-2 text-sm font-medium hover:text-primary"
        >
          {product.name}
        </Link>

        <p className="text-base font-semibold text-primary">
          {formatBaht(product.pricePerPackMinor)}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            /pack
          </span>
        </p>

        <p className="text-xs text-muted-foreground">
          {formatPackSummary(product.unitsPerPack, product.minPacks)}
        </p>

        {/* Null average, not zero — an unrated product is not a bad one, so
            it shows nothing rather than an empty star row. */}
        {product.rating && product.rating.average !== null ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-warning text-warning" />
            {product.rating.average.toFixed(1)}
            <span>({product.rating.count})</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
