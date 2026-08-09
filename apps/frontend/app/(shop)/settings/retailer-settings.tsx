'use client'

import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { updateRetailerProfile } from '@/app/actions/account'
import {
  AccountCard,
  CardAction,
  ReadOnlyGrid,
  ReadOnlyRow,
} from '@/components/account/card'
import { useT } from '@/components/i18n-provider'
import { ProfileForm, type ProfileField } from '@/components/profile-form'
import type { RetailerProfile } from '@/lib/types'

/**
 * The retailer's own details.
 *
 * Reads before it edits, as the designer's card does. Most visits here are to
 * check what is on file rather than to change it, and a page of open form
 * fields makes "what is my postcode" a harder question than it should be.
 *
 * Pipeline fields — shop type, zone, admin notes — are deliberately absent.
 * An admin maintains those from the console, and the API refuses them here.
 */
export function RetailerSettings({ profile }: { profile: RetailerProfile }) {
  const t = useT()
  const [editing, setEditing] = useState(false)

  const fields: ProfileField[] = [
    {
      name: 'shopName',
      label: t('settings.shopName'),
      value: profile.shopName,
      maxLength: 120,
    },
    {
      name: 'phone',
      label: t('settings.phone'),
      value: profile.phone,
      maxLength: 20,
    },
    {
      name: 'addressLine',
      label: t('settings.address'),
      value: profile.addressLine,
      maxLength: 200,
      // Worth saying plainly: an order already placed keeps the address it was
      // placed with, because checkout snapshots it.
      hint: t('settings.addressHint'),
    },
    {
      name: 'province',
      label: t('settings.province'),
      value: profile.province,
      maxLength: 100,
    },
    {
      name: 'postalCode',
      label: t('settings.postalCode'),
      value: profile.postalCode,
      maxLength: 10,
    },
    {
      name: 'taxId',
      label: t('settings.taxId'),
      value: profile.taxId ?? '',
      optional: true,
      maxLength: 20,
    },
  ]

  return (
    <AccountCard
      title={t('settings.details')}
      action={
        editing ? null : (
          <CardAction icon={Pencil} onClick={() => setEditing(true)}>
            {t('settings.edit')}
          </CardAction>
        )
      }
    >
      {editing ? (
        <ProfileForm
          fields={fields}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
          onSave={async (values) =>
            updateRetailerProfile(
              {
                shopName: values.shopName,
                phone: values.phone,
                addressLine: values.addressLine,
                province: values.province,
                postalCode: values.postalCode,
                // An emptied box means "remove this", which the API models
                // as null.
                taxId: values.taxId === '' ? null : values.taxId,
              },
              {
                shopName: profile.shopName,
                phone: profile.phone,
                addressLine: profile.addressLine,
                province: profile.province,
                postalCode: profile.postalCode,
                taxId: profile.taxId,
              }
            )
          }
        />
      ) : (
        <ReadOnlyGrid>
          {fields.map((field) => (
            <ReadOnlyRow
              key={field.name}
              label={field.label}
              value={field.value}
              empty={t('settings.notSet')}
            />
          ))}
        </ReadOnlyGrid>
      )}
    </AccountCard>
  )
}
