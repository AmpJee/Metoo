'use client'

import { MapPin, Pencil } from 'lucide-react'
import { useState } from 'react'
import { AccountCard, CardAction } from '@/components/account/card'
import { useT } from '@/components/i18n-provider'
import type { RetailerProfile } from '@/lib/types'
import { DeliveryAddressForm } from './delivery-address-form'

/**
 * Where parcels go, shown the way the designer's card shows it: the address
 * as an address, not as seven form fields.
 *
 * Reading it back as a block is the point — a shopkeeper checking the courier
 * has the right place should see what the courier sees, and separate labelled
 * boxes make that surprisingly hard.
 *
 * Empty is a real state, not a gap: leave it blank and checkout falls back to
 * the shop address. The empty text says so.
 */
export function DeliveryCard({ profile }: { profile: RetailerProfile }) {
  const t = useT()
  const [editing, setEditing] = useState(false)

  const hasAddress = Boolean(profile.deliveryAddressLine)

  // Sub-district, district, province and postcode on one line, in the order a
  // Thai address is written, skipping whatever is missing.
  const locality = [
    profile.deliverySubdistrict,
    profile.deliveryDistrict,
    profile.deliveryProvince,
    profile.deliveryPostalCode,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AccountCard
      title={t('delivery.title')}
      icon={MapPin}
      action={
        editing ? null : (
          <CardAction icon={Pencil} onClick={() => setEditing(true)}>
            {t('settings.edit')}
          </CardAction>
        )
      }
    >
      {editing ? (
        <DeliveryAddressForm
          profile={profile}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      ) : hasAddress ? (
        <address className="flex flex-col gap-1 text-[18px] not-italic">
          {profile.deliveryRecipient || profile.deliveryPhone ? (
            <p className="text-black">
              {[profile.deliveryRecipient, profile.deliveryPhone]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
          <p className="text-black/55">{profile.deliveryAddressLine}</p>
          {locality ? <p className="text-black/55">{locality}</p> : null}
        </address>
      ) : (
        <p className="text-[18px] text-black/40">
          {t('delivery.usingShopAddress')}
        </p>
      )}
    </AccountCard>
  )
}
