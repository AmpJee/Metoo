'use client'

import { Loader2, QrCode } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { placeOrder } from '@/app/actions/checkout'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'

/**
 * PromptPay is the only way to pay, so this screen states it rather than
 * asking.
 *
 * It used to be a radio group with Card greyed out beside it. A choice of one
 * is not a choice, and a disabled option a buyer cannot pick is a question
 * they still have to read. `Order.paymentMethod` keeps the enum for the day
 * card or cash arrives; until then the value is fixed here.
 */
export function CheckoutForm({ brandCount }: { brandCount: number }) {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">
          {t('checkout.paymentMethod')}
        </h2>
        <div className="flex items-center gap-3 rounded-[9px] border border-primary bg-primary/5 p-4">
          <QrCode className="size-5 shrink-0 text-neutral-dark" />
          <span className="flex flex-col">
            <span className="text-sm font-medium">
              {t('checkout.promptpay')}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('checkout.promptpayHint')}
            </span>
          </span>
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
            const result = await placeOrder('PROMPTPAY')
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
