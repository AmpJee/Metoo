'use client'

import { CreditCard, Loader2, QrCode } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { placeOrder } from '@/app/actions/checkout'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import type { MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * Only PROMPTPAY is selectable.
 *
 * Card is shown but disabled — a buyer who expects to pay by card should see
 * it is coming rather than wonder. Cash on delivery is gone entirely: it is
 * still a valid `RetailerProfile.preferredPayment` the admin console reads, so
 * the shared enum keeps it; this screen just does not offer it.
 */
type PaymentPreference = 'PROMPTPAY' | 'CARD'

const OPTIONS: {
  value: PaymentPreference
  labelKey: MessageKey
  hintKey: MessageKey
  icon: typeof QrCode
  disabled?: boolean
}[] = [
  {
    value: 'PROMPTPAY',
    labelKey: 'checkout.promptpay',
    hintKey: 'checkout.promptpayHint',
    icon: QrCode,
  },
  {
    value: 'CARD',
    labelKey: 'checkout.card',
    hintKey: 'checkout.cardHint',
    icon: CreditCard,
    disabled: true,
  },
]

export function CheckoutForm({ brandCount }: { brandCount: number }) {
  const router = useRouter()
  const t = useT()
  const [method, setMethod] = useState<PaymentPreference>('PROMPTPAY')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">
          {t('checkout.paymentMethod')}
        </h2>
        <div className="flex flex-col gap-2">
          {OPTIONS.map((option) => (
            <label
              key={option.value}
              aria-disabled={option.disabled}
              className={cn(
                'flex items-center gap-3 rounded-[9px] border p-4 transition-colors',
                option.disabled
                  ? 'cursor-not-allowed border-border opacity-50'
                  : 'cursor-pointer',
                !option.disabled && method === option.value
                  ? 'border-primary bg-primary/5'
                  : !option.disabled
                    ? 'border-border hover:border-neutral-line'
                    : ''
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={method === option.value}
                disabled={option.disabled}
                onChange={() => setMethod(option.value)}
                className="sr-only"
              />
              <option.icon className="size-5 shrink-0 text-neutral-dark" />
              <span className="flex flex-col">
                <span className="text-sm font-medium">
                  {t(option.labelKey)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(option.hintKey)}
                </span>
              </span>
            </label>
          ))}
        </div>

        {/* Honest about what this button does. There is no payment module on
            the API yet, so nothing is charged — the QR comes after the order
            is placed, and the seller confirms the transfer arrived. */}
        <p className="rounded-md bg-secondary p-3 text-xs text-muted-foreground">
          {t('checkout.noPaymentNow')}
        </p>
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Button
        size="lg"
        disabled={pending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await placeOrder(method)
            if (!result.ok) {
              setError(result.error)
              return
            }
            router.replace(
              `/orders/group/${result.result.checkoutGroupId}?placed=1`
            )
            router.refresh()
          })
        }}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {brandCount > 1
          ? t('checkout.placeOrderSplit', { n: brandCount })
          : t('checkout.placeOrder')}
      </Button>
    </div>
  )
}
