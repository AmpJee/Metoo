'use client'

import { updateRetailerProfile } from '@/app/actions/account'
import { ProfileForm, type ProfileField } from '@/components/profile-form'
import type { RetailerProfile } from '@/lib/types'

/**
 * The retailer's own details.
 *
 * Pipeline fields — shop type, zone, admin notes — are deliberately absent.
 * An admin maintains those from the console, and the API refuses them here.
 */
export function RetailerSettings({ profile }: { profile: RetailerProfile }) {
  const fields: ProfileField[] = [
    {
      name: 'shopName',
      label: 'Shop name',
      value: profile.shopName,
      maxLength: 120,
    },
    { name: 'phone', label: 'Phone', value: profile.phone, maxLength: 20 },
    {
      name: 'addressLine',
      label: 'Address',
      value: profile.addressLine,
      maxLength: 200,
      // Worth saying plainly: an order already placed keeps the address it was
      // placed with, because checkout snapshots it.
      hint: 'Where future orders are delivered. Orders already placed keep the address you gave at checkout.',
    },
    {
      name: 'province',
      label: 'Province',
      value: profile.province,
      maxLength: 100,
    },
    {
      name: 'postalCode',
      label: 'Postal code',
      value: profile.postalCode,
      maxLength: 10,
    },
    {
      name: 'taxId',
      label: 'Tax ID',
      value: profile.taxId ?? '',
      optional: true,
      maxLength: 20,
    },
  ]

  return (
    <ProfileForm
      fields={fields}
      onSave={async (values) =>
        updateRetailerProfile(
          {
            shopName: values.shopName,
            phone: values.phone,
            addressLine: values.addressLine,
            province: values.province,
            postalCode: values.postalCode,
            // An emptied box means "remove this", which the API models as null.
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
  )
}
