import { ShoppingBag } from 'lucide-react'
import { PictureUpload } from '@/components/picture-upload'
import { getT } from '@/lib/i18n/server'
import type { RetailerProfile } from '@/lib/types'

/**
 * Who this account is, and the picture that represents it.
 *
 * The designer's version of this card is identity only — an icon tile, the
 * name, the account type. The avatar lives in the header dropdown there and
 * is a fixed demo image. Here the upload is real, so it takes the place of
 * that icon tile: this is the one card on the page that is about the account
 * rather than about a setting, which makes it where a shopkeeper looks for
 * their own picture.
 */
export async function AccountCardHeader({
  profile,
}: {
  profile: RetailerProfile
}) {
  const t = await getT()

  return (
    <section className="flex w-full flex-wrap items-center gap-5 rounded-[9px] bg-white p-6">
      <PictureUpload
        who="retailer"
        url={profile.avatarUrl}
        label={profile.shopName}
        variant="avatar"
      />

      <div className="flex min-w-[200px] flex-col gap-0.5">
        <p className="text-[22px] font-bold text-black">{profile.shopName}</p>
        <p className="flex items-center gap-1.5 text-[16px] text-black/55">
          <ShoppingBag className="size-4 shrink-0" />
          {t('settings.retailerAccount')}
        </p>
      </div>
    </section>
  )
}
