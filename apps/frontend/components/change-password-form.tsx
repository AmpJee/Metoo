'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PasswordInput } from '@/components/ui/password-input'

/** Matches the API's own minimum, so a short password is refused instantly. */
const MIN_LENGTH = 8

/**
 * Change your password.
 *
 * Posts to /api/auth/password rather than calling the API through a server
 * action, because the response carries a fresh token pair that has to land in
 * the cookies: changing a password revokes every other session, and the old
 * refresh token is dead the moment the call returns. The route handler writes
 * them, so the user stays signed in here and is signed out everywhere else.
 *
 * Works for all three roles — the endpoint does not care which.
 */
export function ChangePasswordForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const currentPassword = String(data.get('currentPassword') ?? '')
    const newPassword = String(data.get('newPassword') ?? '')
    const confirm = String(data.get('confirmPassword') ?? '')

    setError(null)
    setDone(false)

    // Checked here, not server-side: the API has no idea what the user typed
    // twice, and a round-trip to say "these do not match" is wasted.
    if (newPassword !== confirm) {
      setError('The two new passwords do not match.')
      return
    }
    if (newPassword.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`)
      return
    }
    if (newPassword === currentPassword) {
      setError('That is the password you already have.')
      return
    }

    setPending(true)
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        setError(payload?.error?.message ?? 'Could not change your password.')
        return
      }

      form.reset()
      setDone(true)
      // New cookies came back on that response; re-run server components with
      // them rather than leaving the page holding the old session.
      router.refresh()
    } catch {
      setError('Cannot reach the server. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-[420px] flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Current password</span>
        <PasswordInput
          name="currentPassword"
          required
          autoComplete="current-password"
          className="h-10 rounded-[9px] border border-border bg-transparent px-3 text-sm outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">New password</span>
        <PasswordInput
          name="newPassword"
          required
          minLength={MIN_LENGTH}
          autoComplete="new-password"
          className="h-10 rounded-[9px] border border-border bg-transparent px-3 text-sm outline-none focus:border-primary"
        />
        <span className="text-xs text-muted-foreground">
          At least {MIN_LENGTH} characters.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Confirm new password</span>
        <PasswordInput
          name="confirmPassword"
          required
          autoComplete="new-password"
          className="h-10 rounded-[9px] border border-border bg-transparent px-3 text-sm outline-none focus:border-primary"
        />
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {done ? (
        <p
          role="status"
          className="rounded-md bg-success/10 px-3 py-2 text-sm text-success"
        >
          Password changed. Any other device signed in as you has been signed
          out.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Change password
      </button>
    </form>
  )
}
