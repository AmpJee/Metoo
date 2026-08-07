'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { updateBankDetails, updateBrandProfile } from '@/app/actions/account'
import { useT } from '@/components/i18n-provider'
import { ProfileForm, type ProfileField } from '@/components/profile-form'
import type { BrandProfile } from '@/lib/types'

export function BrandSettings({ profile }: { profile: BrandProfile }) {
  const t = useT()

  const fields: ProfileField[] = [
    {
      name: 'name',
      label: t('sellerSettings.name'),
      value: profile.name,
      maxLength: 120,
    },
    {
      name: 'description',
      label: t('sellerSettings.about'),
      value: profile.description ?? '',
      multiline: true,
      optional: true,
      maxLength: 1000,
      hint: t('sellerSettings.aboutHint'),
    },
    {
      name: 'phone',
      label: t('sellerSettings.phone'),
      value: profile.phone,
      maxLength: 20,
    },
    {
      name: 'addressLine',
      label: t('sellerSettings.address'),
      value: profile.addressLine,
      maxLength: 200,
      hint: t('sellerSettings.addressHint'),
    },
    {
      name: 'province',
      label: t('sellerSettings.province'),
      value: profile.province,
      maxLength: 100,
    },
    {
      name: 'postalCode',
      label: t('sellerSettings.postalCode'),
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
  const t = useT()
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
          {/* Two whole sentences rather than a trailing " · name" fragment:
              Thai puts the account holder before the bank, so appending it
              afterwards reads backwards. */}
          {t(profile.bankAccountName ? 'bank.currentNamed' : 'bank.current', {
            bank: profile.bankName ?? '',
            last4: profile.bankAccountLast4,
            name: profile.bankAccountName ?? '',
          })}
        </p>
      ) : (
        <p className="rounded-[9px] border border-border px-3 py-2 text-sm text-muted-foreground">
          {t('bank.none')}
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('bank.name')}</span>
        <input
          name="bankName"
          required
          maxLength={100}
          className="h-10 rounded-[9px] border border-border bg-transparent px-3 text-sm outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('bank.accountName')}</span>
        <input
          name="bankAccountName"
          required
          maxLength={120}
          className="h-10 rounded-[9px] border border-border bg-transparent px-3 text-sm outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('bank.accountNumber')}</span>
        <input
          name="bankAccountNumber"
          required
          inputMode="numeric"
          pattern="[0-9][0-9 \-]{7,24}"
          autoComplete="off"
          className="h-10 rounded-[9px] border border-border bg-transparent px-3 text-sm outline-none focus:border-primary"
        />
        <span className="text-xs text-muted-foreground">
          {t('bank.accountNumberHint')}
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
          {t('bank.saved')}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-[9px] bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t('bank.save')}
      </button>
    </form>
  )
}
