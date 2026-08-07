'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { confirmDelivered } from '@/app/actions/orders'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'

/**
 * "I received this order" — step 5 to 6.
 *
 * Confirmed before it fires, because it is not reversible and it is not
 * cosmetic: it releases the brand's payment. The buyer should know that is
 * what the button does, which is also why the helper text says so rather than
 * leaving it as a silent side effect.
 */
export function ConfirmDeliveredButton({
  orderId,
  className,
}: {
  orderId: string
  className?: string
}) {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const run = () => {
    if (!window.confirm(t('order.confirmDeliveredAsk'))) return

    setError(null)
    startTransition(async () => {
      const result = await confirmDelivered(orderId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className={className}>
      <Button className="w-full" disabled={pending} onClick={run}>
        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {t('order.confirmDelivered')}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        {t('order.confirmDeliveredHint')}
      </p>
      {error ? (
        <p
          role="alert"
          className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
