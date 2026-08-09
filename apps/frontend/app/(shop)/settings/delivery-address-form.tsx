'use client'

import { PROVINCES } from '@metoo/shared'
import { Loader2, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { updateRetailerProfile } from '@/app/actions/account'
import { districtsForProvince } from '@/app/actions/address'
import { Field } from '@/components/auth-shell'
import { useLocale, useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AddressDistrict, RetailerProfile } from '@/lib/types'

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
 */
const SELECT_CLASS =
  'flex h-10 w-full rounded-lg bg-input px-3 text-sm disabled:opacity-50'

export function DeliveryAddressForm({ profile }: { profile: RetailerProfile }) {
  const router = useRouter()
  const t = useT()
  const locale = useLocale()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  // The three area fields are controlled, unlike the rest of the form:
  // choosing a province has to clear what is below it, and a postcode has to
  // appear without being typed. Neither is expressible with defaultValue.
  const [province, setProvince] = useState(profile.deliveryProvince ?? '')
  const [district, setDistrict] = useState(profile.deliveryDistrict ?? '')
  const [subDistrict, setSubDistrict] = useState(
    profile.deliverySubdistrict ?? ''
  )
  const [postalCode, setPostalCode] = useState(profile.deliveryPostalCode ?? '')
  const [districts, setDistricts] = useState<AddressDistrict[]>([])
  const [loading, setLoading] = useState(false)

  // A saved address opens with its province already chosen, so the selects
  // below it need their options before anyone touches the form.
  useEffect(() => {
    if (!province) {
      setDistricts([])
      return
    }

    let current = true
    setLoading(true)

    districtsForProvince(province)
      .then((result) => {
        if (current) setDistricts(result)
      })
      .finally(() => {
        if (current) setLoading(false)
      })

    // Guards against a slow first province resolving after a second was
    // picked, which would leave the wrong districts on screen.
    return () => {
      current = false
    }
  }, [province])

  const subDistricts =
    districts.find((entry) => entry.name === district)?.subDistricts ?? []

  function onProvinceChange(next: string) {
    setProvince(next)
    // A district in Chiang Mai means nothing once the province is Phuket.
    setDistrict('')
    setSubDistrict('')
    setPostalCode('')
  }

  function onDistrictChange(next: string) {
    setDistrict(next)
    setSubDistrict('')
    setPostalCode('')
  }

  function onSubDistrictChange(next: string) {
    setSubDistrict(next)
    const match = subDistricts.find((entry) => entry.name === next)
    if (match) setPostalCode(match.postalCode)
  }

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
      setSaved(true)
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

      {/* Province → district → sub-district, each one narrowing the next, and
          the postcode filling itself in from the sub-district. Free text here
          was how แขวง and เขต got misspelt, and a courier finds that out while
          holding the parcel. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('delivery.province')}>
          <select
            name="deliveryProvince"
            value={province}
            onChange={(event) => onProvinceChange(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">{t('delivery.chooseProvince')}</option>
            {PROVINCES.map((entry) => (
              <option key={entry.code} value={entry.th}>
                {locale === 'th' ? entry.th : entry.en}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('delivery.district')}>
          <select
            name="deliveryDistrict"
            value={district}
            disabled={!province || loading}
            onChange={(event) => onDistrictChange(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">
              {loading
                ? t('common.loading')
                : province
                  ? t('delivery.chooseDistrict')
                  : t('delivery.provinceFirst')}
            </option>
            {districts.map((entry) => (
              <option key={entry.name} value={entry.name}>
                {entry.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('delivery.subdistrict')}>
          <select
            name="deliverySubdistrict"
            value={subDistrict}
            disabled={!district}
            onChange={(event) => onSubDistrictChange(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">
              {district
                ? t('delivery.chooseSubdistrict')
                : t('delivery.districtFirst')}
            </option>
            {subDistricts.map((entry) => (
              <option key={entry.name} value={entry.name}>
                {entry.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('delivery.postalCode')}>
          {/* Filled from the sub-district but still editable: three
              sub-districts carry two postcodes, and the tree keeps only the
              first. Typing over it has to stay possible. */}
          <Input
            name="deliveryPostalCode"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
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
