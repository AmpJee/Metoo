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
 * Brand signup.
 *
 * Fields mirror the BRAND branch of the backend's discriminated union: name,
 * phone, addressLine, province and postalCode are required; description is
 * not. It is a different shape from the retailer form — a brand has a brand
 * name and a story, a retailer has a shop name and a tax ID — which is why
 * these are two forms rather than one with a toggle.
 *
 * Nothing here asks for อย. certificates or ID documents. Those are collected
 * during onboarding, once an admin is actually talking to the brand; asking a
 * stranger to upload their national ID before they have seen the product is a
 * good way to lose them at the first screen.
 */
export function SellerRegisterForm() {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const description = String(form.get('description') ?? '').trim()

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          role: 'BRAND',
          email: form.get('email'),
          password: form.get('password'),
          name: form.get('name'),
          phone: form.get('phone'),
          addressLine: form.get('addressLine'),
          province: form.get('province'),
          postalCode: form.get('postalCode'),
          // Omit rather than send "" — the schema caps the length, but an
          // empty string is not the same as "not provided".
          ...(description ? { description } : {}),
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
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
      <Field label={t('signup.brand.name')}>
        <Input name="name" required maxLength={120} />
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

      <Field label={t('signup.brand.about')}>
        <textarea
          name="description"
          rows={3}
          maxLength={1000}
          placeholder={t('signup.brand.aboutPlaceholder')}
          className="w-full rounded-lg bg-input px-3 py-2 text-sm placeholder:text-muted-foreground"
        />
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
