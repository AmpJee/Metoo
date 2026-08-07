'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Field } from '@/components/auth-shell'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'

/**
 * Retailer signup.
 *
 * Fields mirror the RETAILER branch of the backend's discriminated union:
 * shopName, phone, addressLine, province, postalCode are required, taxId is
 * not. Submitting anything less returns a 422.
 */
export function RegisterForm() {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const taxId = String(form.get('taxId') ?? '').trim()

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          shopName: form.get('shopName'),
          phone: form.get('phone'),
          addressLine: form.get('addressLine'),
          province: form.get('province'),
          postalCode: form.get('postalCode'),
          // Omit rather than send "" — the schema caps length but an empty
          // string is not the same as "not provided".
          ...(taxId ? { taxId } : {}),
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        // The API's message wins when it has one — it says which field was
        // wrong. It is English for now; see the note in lib/api.ts.
        setError(payload?.error?.message ?? t('signup.failed'))
        return
      }

      // A new account is never ONBOARDED, so this always lands on /pending.
      router.replace('/pending')
      router.refresh()
    } catch {
      setError(t('auth.unreachable'))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label={t('signup.retailer.shopName')}>
        <Input name="shopName" required maxLength={120} />
      </Field>
      <Field label={t('auth.email')}>
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label={t('auth.password')}>
        <PasswordInput
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>
      <p className="-mt-2 text-xs text-muted-foreground">
        {t('signup.passwordHint')}
      </p>

      <Field label={t('signup.phone')}>
        <Input name="phone" required minLength={6} maxLength={20} />
      </Field>
      <Field label={t('signup.addressLine')}>
        <Input name="addressLine" required maxLength={200} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t('signup.province')}>
          <Input name="province" required maxLength={100} />
        </Field>
        <Field label={t('signup.postalCode')}>
          <Input name="postalCode" required minLength={4} maxLength={10} />
        </Field>
      </div>

      <Field label={t('signup.retailer.taxId')}>
        <Input name="taxId" maxLength={20} />
      </Field>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t('signup.create')}
      </Button>
    </form>
  )
}
