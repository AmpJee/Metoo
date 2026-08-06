'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { updateBankDetails, updateBrandProfile } from '@/app/actions/account'
import { ProfileForm, type ProfileField } from '@/components/profile-form'
import type { BrandProfile } from '@/lib/types'

export function BrandSettings({ profile }: { profile: BrandProfile }) {
  const fields: ProfileField[] = [
    { name: 'name', label: 'Brand name', value: profile.name, maxLength: 120 },
    {
      name: 'description',
      label: 'About your brand',
      value: profile.description ?? '',
      multiline: true,
      optional: true,
      maxLength: 1000,
      hint: 'Shown on your storefront.',
    },
    { name: 'phone', label: 'Phone', value: profile.phone, maxLength: 20 },
    {
      name: 'addressLine',
      label: 'Address',
      value: profile.addressLine,
      maxLength: 200,
      hint: 'Where couriers collect your parcels.',
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
  ]

  return (
    <ProfileForm
      fields={fields}
      onSave={async (values) =>
        updateBrandProfile(
          {
            name: values.name,
            description: values.description === '' ? null : values.description,
            phone: values.phone,
            addressLine: values.addressLine,
            province: values.province,
            postalCode: values.postalCode,
          },
          {
            name: profile.name,
            description: profile.description,
            phone: profile.phone,
            addressLine: profile.addressLine,
            province: profile.province,
            postalCode: profile.postalCode,
          }
        )
      }
    />
  )
}

/**
 * Where withdrawals are paid.
 *
 * Its own form, not part of the profile edit above, because it is a different
 * kind of change: an admin reads these to make a manual bank transfer, so
 * moving where the money lands should be deliberate rather than a side effect
 * of correcting an address.
 *
 * The number is write-only. Reads give the last four digits, so the field
 * starts empty and saving means retyping it in full — which is also the
 * confirmation that the person doing it knows the account.
 */
export function BankForm({ profile }: { profile: BrandProfile }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updateBankDetails({
        bankName: String(data.get('bankName') ?? '').trim(),
        bankAccountName: String(data.get('bankAccountName') ?? '').trim(),
        bankAccountNumber: String(data.get('bankAccountNumber') ?? '').trim(),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      form.reset()
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-[560px] flex-col gap-4">
      {profile.bankAccountLast4 ? (
        <p className="rounded-[9px] border border-border px-3 py-2 text-sm text-muted-foreground">
          Currently paying out to {profile.bankName} ····
          {profile.bankAccountLast4}
          {profile.bankAccountName ? ` · ${profile.bankAccountName}` : null}
        </p>
      ) : (
        <p className="rounded-[9px] border border-border px-3 py-2 text-sm text-muted-foreground">
          No bank account on file — you cannot withdraw until you add one.
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Bank</span>
        <input
          name="bankName"
          required
          maxLength={100}
          className="h-10 rounded-[9px] border border-border bg-transparent px-3 text-sm outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Account name</span>
        <input
          name="bankAccountName"
          required
          maxLength={120}
          className="h-10 rounded-[9px] border border-border bg-transparent px-3 text-sm outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Account number</span>
        <input
          name="bankAccountNumber"
          required
          inputMode="numeric"
          pattern="[0-9][0-9 \-]{7,24}"
          autoComplete="off"
          className="h-10 rounded-[9px] border border-border bg-transparent px-3 text-sm outline-none focus:border-primary"
        />
        <span className="text-xs text-muted-foreground">
          Digits, spaces or dashes. Stored for admin payouts only and never
          shown back in full.
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {saved ? (
        <p
          role="status"
          className="rounded-md bg-success/10 px-3 py-2 text-sm text-success"
        >
          Bank details saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-[9px] bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Save bank details
      </button>
    </form>
  )
}
