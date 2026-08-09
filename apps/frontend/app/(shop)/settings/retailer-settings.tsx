'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { updateRetailerProfile } from '@/app/actions/account'
import { AddressFields } from '@/components/address-fields'
import { Field } from '@/components/auth-shell'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { RetailerProfile } from '@/lib/types'

/**
 * ที่อยู่ร้านค้า — who this business is and where it trades.
 *
 * Its own form rather than the shared `ProfileForm`, which renders a flat
 * list of independent inputs. The address is four linked controls where each
 * one narrows the next, and a generic field list has no way to express that.
 * `ProfileForm` still serves the seller console, whose fields really are
 * independent.
 *
 * Reads before it edits, as the designer's card does. Most visits here are to
 * check what is on file rather than to change it, and a page of open form
 * fields makes "what is my postcode" a harder question than it should be.
 *
 * Pipeline fields — shop type, zone, admin notes — are deliberately absent.
 * An admin maintains those from the console, and the API refuses them here.
 */
export function RetailerSettings({ profile }: { profile: RetailerProfile }) {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (name: string) => String(data.get(name) ?? '').trim()

    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updateRetailerProfile(
        {
          shopName: text('shopName'),
          phone: text('phone'),
          addressLine: text('addressLine'),
          // Null rather than '' so a wrongly-picked area can be cleared.
          // The API models "remove this" as null; an empty string would be
          // stored as an empty district.
          subdistrict: text('subdistrict') || null,
          district: text('district') || null,
          province: text('province'),
          postalCode: text('postalCode'),
          taxId: text('taxId') || null,
        },
        {
          shopName: profile.shopName,
          phone: profile.phone,
          addressLine: profile.addressLine,
          subdistrict: profile.subdistrict,
          district: profile.district,
          province: profile.province,
          postalCode: profile.postalCode,
          taxId: profile.taxId,
        }
      )

      if (!result.ok) {
        setError(result.error)
        return
      }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-[640px] flex-col gap-4">
      <Field label={t('settings.shopName')}>
        <Input
          name="shopName"
          required
          maxLength={120}
          defaultValue={profile.shopName}
        />
      </Field>

      <Field label={t('settings.phone')}>
        <Input
          name="phone"
          type="tel"
          required
          maxLength={20}
          defaultValue={profile.phone}
        />
      </Field>

      <Field label={t('settings.address')}>
        <Input
          name="addressLine"
          required
          maxLength={200}
          defaultValue={profile.addressLine}
          placeholder={t('delivery.addressLinePlaceholder')}
        />
      </Field>
      {/* Worth saying plainly: an order already placed keeps the address it
          was placed with, because checkout snapshots it. */}
      <p className="-mt-2 text-xs text-muted-foreground">
        {t('settings.addressHint')}
      </p>

      <AddressFields
        names={{
          subdistrict: 'subdistrict',
          district: 'district',
          province: 'province',
          postalCode: 'postalCode',
        }}
        initial={{
          subdistrict: profile.subdistrict ?? '',
          district: profile.district ?? '',
          province: profile.province,
          postalCode: profile.postalCode,
        }}
      />

      <Field label={`${t('settings.taxId')} ${t('common.optional')}`}>
        <Input name="taxId" maxLength={20} defaultValue={profile.taxId ?? ''} />
      </Field>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
          {t('common.save')}
        </Button>
        {saved ? (
          <span className="text-sm text-success">{t('common.saved')}</span>
        ) : null}
      </div>
    </form>
  )
}
