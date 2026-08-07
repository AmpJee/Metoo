'use client'

import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Field } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { useT } from '@/components/i18n-provider'
import type { PortalKey } from '@/lib/portals'
import { homeForUser } from '@/lib/roles'

/**
 * What to show when a sign-in is refused.
 *
 * WRONG_PORTAL is deliberately flattened into the same wording as a bad
 * password. The API answers it only after the password checks out, so naming
 * the account type is not a leak — but it reads as "your password worked,
 * now go somewhere else", which is a confusing thing to tell someone who
 * simply used the wrong page. One message for every refusal is less to
 * interpret.
 *
 * The account is still not signed in either way; the distinction only ever
 * affected the wording.
 */
function signInError(error: { code?: string; message?: string } | undefined) {
  if (error?.code === 'WRONG_PORTAL') return 'Email or password is incorrect.'
  return error?.message ?? 'Could not sign you in.'
}

export function LoginForm({ portal }: { portal: PortalKey }) {
  const t = useT()
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          // Named so the API can refuse an account for a different site with
          // a message that says where to go, instead of letting them in and
          // 403ing on every screen after.
          portal,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(
          payload?.error?.code === 'WRONG_PORTAL' ||
            payload?.error?.code === 'INVALID_CREDENTIALS'
            ? t('auth.badCredentials')
            : (signInError(payload?.error) ?? t('auth.badCredentials'))
        )
        return
      }

      // Login succeeds even for unapproved accounts, so the destination
      // depends on role and status, not on success alone. /api/auth/login
      // returns both for exactly this.
      const next = params.get('next')
      router.replace(
        next && next.startsWith('/')
          ? next
          : homeForUser({ role: payload.role, status: payload.status })
      )
      // The session lives in httpOnly cookies the client cannot see; refresh
      // so server components re-run with it.
      router.refresh()
    } catch {
      setError(t('auth.unreachable'))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label={t('auth.email')}>
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label={t('auth.password')}>
        <PasswordInput
          name="password"
          required
          autoComplete="current-password"
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
        {t('auth.login')}
      </Button>
    </form>
  )
}
