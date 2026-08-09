'use client'

import { PROVINCES } from '@metoo/shared'
import { Loader2, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { updateRetailerProfile } from '@/app/actions/account'
import { Field } from '@/components/auth-shell'
import { useLocale, useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { RetailerProfile } from '@/lib/types'

/**
 * Where parcels go — separate from the shop address on purpose.
 *
 * A shop trades at one address and takes deliveries at another more often than
 * not: a warehouse, a condo lobby, a relative who is in during the day. One
 * field forced a retailer to choose which of the two truths to store, and the
 * courier got whichever they picked.
 *
 * Broken into the parts a Thai label needs. แขวง/ตำบล and เขต/อำเภอ are their
 * own fields rather than more free text, because a single line cannot be
 * sorted by district and every domestic courier asks for them separately.
 *
 * Optional as a whole: leave it blank and checkout falls back to the shop
 * address, which is where goods went before this existed. The empty state
 * says so rather than leaving someone guessing whether they have to fill it.
 *
 * `onSaved`/`onCancel` let the account card collapse back to the address as
 * written once it is saved; see `delivery-card.tsx`.
 */
export function DeliveryAddressForm({
  profile,
  onSaved,
  onCancel,
}: {
  profile: RetailerProfile
  onSaved?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const t = useT()
  const locale = useLocale()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const usingShopAddress = !profile.deliveryAddressLine

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (name: string) => String(data.get(name) ?? '').trim()

    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updateRetailerProfile(
        {
          deliveryRecipient: text('deliveryRecipient'),
          deliveryPhone: text('deliveryPhone'),
          deliveryAddressLine: text('deliveryAddressLine'),
          deliverySubdistrict: text('deliverySubdistrict'),
          deliveryDistrict: text('deliveryDistrict'),
          deliveryProvince: text('deliveryProvince'),
          deliveryPostalCode: text('deliveryPostalCode'),
        },
        {
          deliveryRecipient: profile.deliveryRecipient,
          deliveryPhone: profile.deliveryPhone,
          deliveryAddressLine: profile.deliveryAddressLine,
          deliverySubdistrict: profile.deliverySubdistrict,
          deliveryDistrict: profile.deliveryDistrict,
          deliveryProvince: profile.deliveryProvince,
          deliveryPostalCode: profile.deliveryPostalCode,
        }
      )

      if (!result.ok) {
        setError(result.error)
        return
      }
      if (onSaved) onSaved()
      else setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {usingShopAddress ? (
        <p className="flex items-start gap-2 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          {t('delivery.usingShopAddress')}
        </p>
      ) : null}

      <Field label={t('delivery.recipient')}>
        <Input
          name="deliveryRecipient"
          maxLength={200}
          defaultValue={profile.deliveryRecipient ?? ''}
          placeholder={t('delivery.recipientPlaceholder')}
        />
      </Field>

      <Field label={t('delivery.phone')}>
        <Input
          name="deliveryPhone"
          type="tel"
          maxLength={30}
          defaultValue={profile.deliveryPhone ?? ''}
        />
      </Field>

      {/* The long line first, matching how a Thai address is written and how
          every delivery app asks for it. */}
      <Field label={t('delivery.addressLine')}>
        <Input
          name="deliveryAddressLine"
          maxLength={500}
          defaultValue={profile.deliveryAddressLine ?? ''}
          placeholder={t('delivery.addressLinePlaceholder')}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('delivery.subdistrict')}>
          <Input
            name="deliverySubdistrict"
            maxLength={100}
            defaultValue={profile.deliverySubdistrict ?? ''}
          />
        </Field>

        <Field label={t('delivery.district')}>
          <Input
            name="deliveryDistrict"
            maxLength={100}
            defaultValue={profile.deliveryDistrict ?? ''}
          />
        </Field>

        {/* A select, not free text: 77 fixed values, and a misspelt province
            is a parcel a courier cannot route. District and sub-district stay
            free text — the province dataset has neither. */}
        <Field label={t('delivery.province')}>
          <select
            name="deliveryProvince"
            defaultValue={profile.deliveryProvince ?? ''}
            className="flex h-10 w-full rounded-lg bg-input px-3 text-sm disabled:opacity-50"
          >
            <option value="">{t('delivery.chooseProvince')}</option>
            {PROVINCES.map((province) => (
              <option key={province.code} value={province.th}>
                {locale === 'th' ? province.th : province.en}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('delivery.postalCode')}>
          {/* Five digits, checked here and again at the API. A postcode typo
              is found by a courier holding the parcel, which is late. */}
          <Input
            name="deliveryPostalCode"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            defaultValue={profile.deliveryPostalCode ?? ''}
          />
        </Field>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-5">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            {t('common.cancel')}
          </button>
        ) : null}

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
