import type { Metadata } from 'next'
import { ChangePasswordForm } from '@/components/change-password-form'
import { PageHeader } from '@/components/dashboard-shell'
import { PictureUpload } from '@/components/picture-upload'
import { api } from '@/lib/api'
import type { BrandProfile } from '@/lib/types'
import { BankForm, BrandSettings } from './brand-settings'

export const metadata: Metadata = { title: 'Settings' }

export default async function SellerSettingsPage() {
  const profile = await api.get<BrandProfile>('/brand/profile')

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your brand details, payout account and sign-in."
      />

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">Brand logo</h2>
          <PictureUpload
            who="brand"
            url={profile.logoUrl}
            label={profile.name}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">Brand details</h2>
          <BrandSettings profile={profile} />
        </section>

        <section className="flex flex-col gap-4 border-t border-border pt-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Payout account</h2>
            <p className="text-sm text-muted-foreground">
              Metoo pays withdrawals here by bank transfer.
            </p>
          </div>
          <BankForm profile={profile} />
        </section>

        <section className="flex flex-col gap-4 border-t border-border pt-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Password</h2>
            <p className="text-sm text-muted-foreground">
              Changing it signs you out on every other device.
            </p>
          </div>
          <ChangePasswordForm />
        </section>
      </div>
    </>
  )
}
