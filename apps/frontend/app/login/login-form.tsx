'use client'

import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Field } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { homeForUser } from '@/lib/roles'

export function LoginForm() {
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
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload?.error?.message ?? 'Could not sign you in.')
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
      setError('Cannot reach the server. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password">
        <Input
          name="password"
          type="password"
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
        Log in
      </Button>
    </form>
  )
}
