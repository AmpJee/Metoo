import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AccountCard } from '@/components/account/card'
import { api } from '@/lib/api'
import { getT } from '@/lib/i18n/server'
import type { RetailerProfile } from '@/lib/types'
import { AccountCardHeader } from './account-card'
import { DeliveryCard } from './delivery-card'
import { PasswordCard } from './password-card'
import { RetailerSettings } from './retailer-settings'
import { ShopOperationsForm } from './shop-operations-form'
import { ShortcutsCard } from './shortcuts-card'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('settings.title') }
}

/**
 * My Account, built to the designer's card layout.
 *
 * A grey page of white cards rather than the divided sections this used to
 * be. Each card reads before it edits — most visits are to check what is on
 * file, not to change it.
 *
 * Two things the designer's version does not have are kept. The avatar upload
 * is real here, so it sits in the identity card at the top where the design
 * puts a picture. "How your shop operates" has no counterpart in the design at
 * all, but the API refuses checkout until its six fields are filled, so
 * dropping it would strand a new shop with nowhere to fix the problem.
 */
export default async function SettingsPage() {
  const t = await getT()

  const profile = await api.get<RetailerProfile>('/retailer/profile')

  return (
    <div className="min-h-full bg-[#f5f5f5] pb-16">
      <div className="container-page flex flex-col gap-5 py-6 md:py-8">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 text-[15px] text-primary transition-opacity hover:opacity-80"
        >
          <ArrowLeft className="size-4" />
          {t('settings.backToShop')}
        </Link>

        <AccountCardHeader profile={profile} />

        <RetailerSettings profile={profile} />

        <DeliveryCard profile={profile} />

        {/* Anchored: the cart links here by id when a shop cannot check out
            yet, so the section it lands on has to be this one. */}
        <div id="shop" className="scroll-mt-8">
          <AccountCard title={t('shopOps.title')}>
            <p className="-mt-2 text-[15px] text-black/45">
              {t('shopOps.subtitle')}
            </p>
            <ShopOperationsForm profile={profile} />
          </AccountCard>
        </div>

        <PasswordCard />

        <ShortcutsCard />
      </div>
    </div>
  )
}
