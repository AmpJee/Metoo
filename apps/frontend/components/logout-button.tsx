'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useT } from '@/components/i18n-provider'
import { Button, type ButtonProps } from '@/components/ui/button'

/** Clears the session cookies through the auth proxy, then returns home. */
export function LogoutButton({
  children,
  ...props
}: Omit<ButtonProps, 'onClick'>) {
  const router = useRouter()
  const t = useT()
  const [pending, setPending] = useState(false)

  // Not a default parameter, because the fallback has to be translated and a
  // default cannot call a hook.
  const label = children ?? t('nav.logout')

  return (
    <Button
      {...props}
      disabled={pending}
      onClick={async () => {
        setPending(true)
        await fetch('/api/auth/logout', { method: 'POST' })
        router.replace('/')
        router.refresh()
      }}
    >
      {label}
    </Button>
  )
}
