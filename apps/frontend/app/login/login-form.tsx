'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Field } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { useT } from '@/components/i18n-provider'
import { PORTALS, type PortalKey } from '@/lib/portals'
import { homeForUser } from '@/lib/roles'
import type { Role } from '@/lib/types'

/** Where an account of this role actually signs in. */
const PORTAL_FOR: Record<Role, PortalKey> = {
  RETAILER: 'retailer',
  BRAND: 'seller',
  ADMIN: 'admin',
}

export function LoginForm({ portal }: { portal: PortalKey }) {
  const t = useT()
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  // Set when the credentials were right but the door was wrong. Carries a
  // link, so the fix is one tap rather than a hunt for the other login page.
  const [wrongPortal, setWrongPortal] = useState<PortalKey | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setWrongPortal(null)
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
        // WRONG_PORTAL used to be flattened into "email or password is
        // incorrect" for consistency. That told the truth about nothing: a
        // brand who signed up at Seller Centre and later used the shop's
        // login was informed their correct password was wrong, and the only
        // sensible thing left to do was reset a password that worked fine.
        // It is the single most likely reason a new account "cannot log in".
        const role = payload?.error?.role as Role | undefined
        if (payload?.error?.code === 'WRONG_PORTAL' && role) {
          setWrongPortal(PORTAL_FOR[role])
          setError(t(`auth.wrongPortal.${role}`))
          return
        }
        setError(
          payload?.error?.code === 'INVALID_CREDENTIALS'
            ? t('auth.badCredentials')
            : (payload?.error?.message ?? t('auth.badCredentials'))
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
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <p>{error}</p>
          {wrongPortal ? (
            <Link
              href={PORTALS[wrongPortal].loginPath}
              className="font-medium underline underline-offset-2"
            >
              {t('auth.wrongPortal.go')}
            </Link>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t('auth.login')}
      </Button>
    </form>
  )
}
