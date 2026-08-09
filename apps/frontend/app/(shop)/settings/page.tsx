import type { Metadata } from 'next'
import { ChangePasswordForm } from '@/components/change-password-form'
import { PictureUpload } from '@/components/picture-upload'
import { api } from '@/lib/api'
import { getT } from '@/lib/i18n/server'
import type { RetailerProfile } from '@/lib/types'
import { RetailerSettings } from './retailer-settings'
import { DeliveryAddressForm } from './delivery-address-form'
import { ShopOperationsForm } from './shop-operations-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('settings.title') }
}

export default async function SettingsPage() {
  const t = await getT()
  const profile = await api.get<RetailerProfile>('/retailer/profile')

  return (
    <div className="container-page flex flex-col gap-10 py-8 md:py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-[20px] font-bold md:text-[32px]">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">{t('settings.picture')}</h2>
        <PictureUpload
          who="retailer"
          url={profile.avatarUrl}
          label={profile.shopName}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">{t('settings.details')}</h2>
        <RetailerSettings profile={profile} />
      </section>

      {/* Its own section, above the operational questions: this is the one
          a shop comes here to change, and burying it under capacity and
          delivery window would hide it. */}
      <section
        id="delivery"
        className="flex flex-col gap-4 scroll-mt-8 border-t border-border pt-8"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">{t('delivery.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('delivery.subtitle')}
          </p>
        </div>
        <DeliveryAddressForm profile={profile} />
      </section>

      <section
        id="shop"
        className="flex flex-col gap-4 scroll-mt-8 border-t border-border pt-8"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">{t('shopOps.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('shopOps.subtitle')}
          </p>
        </div>
        <ShopOperationsForm profile={profile} />
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">{t('password.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('password.subtitle')}
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </div>
  )
}
