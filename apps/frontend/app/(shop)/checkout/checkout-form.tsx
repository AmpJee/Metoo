'use client'

import { Banknote, CreditCard, Loader2, QrCode } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { placeOrder } from '@/app/actions/checkout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PaymentPreference = 'PROMPTPAY' | 'CASH' | 'CARD'

const OPTIONS: {
  value: PaymentPreference
  label: string
  hint: string
  icon: typeof QrCode
}[] = [
  {
    value: 'PROMPTPAY',
    label: 'QR PromptPay',
    hint: 'Transfer when the brand confirms',
    icon: QrCode,
  },
  {
    value: 'CARD',
    label: 'Credit / Debit Card',
    hint: 'Arranged after confirmation',
    icon: CreditCard,
  },
  {
    value: 'CASH',
    label: 'Cash on delivery',
    hint: 'Pay the courier on arrival',
    icon: Banknote,
  },
]

export function CheckoutForm({ brandCount }: { brandCount: number }) {
  const router = useRouter()
  const [method, setMethod] = useState<PaymentPreference>('PROMPTPAY')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Payment Method</h2>
        <div className="flex flex-col gap-2">
          {OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-[9px] border p-4 transition-colors',
                method === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-neutral-line'
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={method === option.value}
                onChange={() => setMethod(option.value)}
                className="sr-only"
              />
              <option.icon className="size-5 shrink-0 text-neutral-dark" />
              <span className="flex flex-col">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </div>

        {/* Honest about what this button does. There is no payment module on
            the API yet, so nothing is charged — recording the preference and
            saying so is better than a Pay Now button that does not pay. */}
        <p className="rounded-md bg-secondary p-3 text-xs text-muted-foreground">
          No payment is taken now. Placing the order sends it to the brand to
          confirm; you will arrange payment with them directly.
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
        Place Order
        {brandCount > 1 ? ` (${brandCount} orders)` : ''}
      </Button>
    </div>
  )
}
