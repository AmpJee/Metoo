import type { Metadata } from 'next'
import { ChangePasswordForm } from '@/components/change-password-form'
import { PictureUpload } from '@/components/picture-upload'
import { api } from '@/lib/api'
import type { RetailerProfile } from '@/lib/types'
import { RetailerSettings } from './retailer-settings'

export const metadata: Metadata = { title: 'Account settings' }

export default async function SettingsPage() {
  const profile = await api.get<RetailerProfile>('/retailer/profile')

  return (
    <div className="container-page flex flex-col gap-10 py-8 md:py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-[20px] font-bold md:text-[32px]">
          Account settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Your shop details and sign-in.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Shop picture</h2>
        <PictureUpload
          who="retailer"
          url={profile.avatarUrl}
          label={profile.shopName}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Shop details</h2>
        <RetailerSettings profile={profile} />
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
  )
}
