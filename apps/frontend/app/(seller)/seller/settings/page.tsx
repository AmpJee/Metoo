import type { Metadata } from 'next'
import { ChangePasswordForm } from '@/components/change-password-form'
import { PageHeader } from '@/components/dashboard-shell'
import { PictureUpload } from '@/components/picture-upload'
import { api } from '@/lib/api'
import { getT } from '@/lib/i18n/server'
import type { BrandProfile } from '@/lib/types'
import { BankForm, BrandSettings } from './brand-settings'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('sellerSettings.title') }
}

export default async function SellerSettingsPage() {
  const t = await getT()
  const profile = await api.get<BrandProfile>('/brand/profile')

  return (
    <>
      <PageHeader
        title={t('sellerSettings.title')}
        description={t('sellerSettings.subtitle')}
      />

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">
            {t('sellerSettings.logo')}
          </h2>
          <PictureUpload
            who="brand"
            url={profile.logoUrl}
            label={profile.name}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">
            {t('sellerSettings.details')}
          </h2>
          <BrandSettings profile={profile} />
        </section>

        <section className="flex flex-col gap-4 border-t border-border pt-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">{t('bank.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('bank.subtitle')}
            </p>
          </div>
          <BankForm profile={profile} />
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
    </>
  )
}
