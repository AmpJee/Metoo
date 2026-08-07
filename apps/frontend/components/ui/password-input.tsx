'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * A password field with a reveal toggle.
 *
 * Typing a password blind is the main reason people fail a sign-in they
 * actually know the credentials for, and it is worse here than usual: half the
 * team is typing on phones.
 *
 * The toggle is a `button type="button"`. Without the explicit type it would
 * default to `submit` and revealing the password would submit the form.
 *
 * It is deliberately not focusable by tab. Someone tabbing email → password →
 * Log in should not land on it, and it stays reachable by pointer or by
 * shift-tabbing back. Screen readers still announce it through aria-label,
 * which changes with the state so it is never stale.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  const describedBy = useId()

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        // Room for the button, so a long password never runs underneath it.
        className={cn('pr-10', className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((shown) => !shown)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-describedby={describedBy}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
      <span id={describedBy} className="sr-only">
        {visible ? 'Password is visible' : 'Password is hidden'}
      </span>
    </div>
  )
}
