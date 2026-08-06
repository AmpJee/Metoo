'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'

/** Clears the session cookies through the auth proxy, then returns home. */
export function LogoutButton({
  children = 'Log out',
  ...props
}: Omit<ButtonProps, 'onClick'>) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

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
      {children}
    </Button>
  )
}
