import { MapPin, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Translate } from '@/lib/i18n'

/**
 * A brand, as a card.
 *
 * Shared by the Stores directory and the Brands row on a search results page,
 * so a shop looks the same wherever a retailer meets it.
 *
 * `t` is threaded in rather than fetched again: this renders once per brand,
 * and a cookie read per tile is a needless cost for a value the caller has.
 */
export function BrandTile({
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
