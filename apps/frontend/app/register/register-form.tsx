'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Field } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Retailer signup.
 *
 * Fields mirror the RETAILER branch of the backend's discriminated union:
 * shopName, phone, addressLine, province, postalCode are required, taxId is
 * not. Submitting anything less returns a 422.
 */
export function RegisterForm() {
  const router = useRouter()
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
        setError(payload?.error?.message ?? 'Could not create your account.')
        return
      }

      // A new account is never ONBOARDED, so this always lands on /pending.
      router.replace('/pending')
      router.refresh()
    } catch {
      setError('Cannot reach the server. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Shop name">
        <Input name="shopName" required maxLength={120} />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password">
        <Input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>
      <p className="-mt-2 text-xs text-muted-foreground">
        At least 8 characters.
      </p>

      <Field label="Phone number">
        <Input name="phone" required minLength={6} maxLength={20} />
      </Field>
      <Field label="Street name, building, house no.">
        <Input name="addressLine" required maxLength={200} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Province">
          <Input name="province" required maxLength={100} />
        </Field>
        <Field label="Postal code">
          <Input name="postalCode" required minLength={4} maxLength={10} />
        </Field>
      </div>

      <Field label="Tax ID (optional)">
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
        Create account
      </Button>
    </form>
  )
}
