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
 * ที่อยู่ในการจัดส่ง — where a parcel is handed over.
 *
 * A shop trades at one address and takes deliveries at another more often
 * than not: a warehouse, a condo lobby, a relative who is in during the day.
 * One field forced a retailer to choose which of the two truths to store, and
 * the courier got whichever they picked.
 *
 * Most shops do take deliveries at the shop, though, which is what the tick
 * is for. Ticked, the fields disappear and saving clears them — "same as the
 * shop address" is stored as *no* delivery address, so there is one address
 * on file rather than two copies free to drift apart. Checkout already falls
 * back to the shop address when this is empty, so the stored shape and the
 * wording on screen finally agree.
 */
export function DeliveryAddressForm({ profile }: { profile: RetailerProfile }) {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  // Opens ticked for a shop that has never set one, which is most of them.
  const [sameAsShop, setSameAsShop] = useState(!profile.deliveryAddressLine)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    // Ticked means clear every delivery field, not "send what was typed
    // before the box was ticked".
    const text = (name: string) =>
      sameAsShop ? '' : String(data.get(name) ?? '').trim()

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
    <form onSubmit={onSubmit} className="flex max-w-[640px] flex-col gap-4">
      <label className="flex w-fit cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={sameAsShop}
          onChange={(event) => setSameAsShop(event.target.checked)}
          className="size-4 accent-primary"
        />
        <span className="text-sm">{t('delivery.sameAsShop')}</span>
      </label>

      {sameAsShop ? (
        <p className="text-sm text-muted-foreground">
          {t('delivery.usingShopAddress')}
        </p>
      ) : (
        <>
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

          {/* The long line first, matching how a Thai address is written and
              how every delivery app asks for it. */}
          <Field label={t('delivery.addressLine')}>
            <Input
              name="deliveryAddressLine"
              maxLength={500}
              defaultValue={profile.deliveryAddressLine ?? ''}
              placeholder={t('delivery.addressLinePlaceholder')}
            />
          </Field>

          <AddressFields
            names={{
              subdistrict: 'deliverySubdistrict',
              district: 'deliveryDistrict',
              province: 'deliveryProvince',
              postalCode: 'deliveryPostalCode',
            }}
            initial={{
              subdistrict: profile.deliverySubdistrict ?? '',
              district: profile.deliveryDistrict ?? '',
              province: profile.deliveryProvince ?? '',
              postalCode: profile.deliveryPostalCode ?? '',
            }}
          />
        </>
      )}

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
