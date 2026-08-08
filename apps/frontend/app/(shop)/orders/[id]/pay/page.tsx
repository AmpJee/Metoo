import { ArrowLeft, Info, QrCode } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { PaymentSlipUpload } from '@/components/payment-slip-upload'
import { Button } from '@/components/ui/button'
import { ApiError, api } from '@/lib/api'
import { env } from '@/lib/env'
import { formatBaht } from '@/lib/format'
import { getT } from '@/lib/i18n/server'
import { awaitingPayment, buyerStatusLabel } from '@/lib/order-status'
import type { Order } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('pay.title') }
}

/**
 * Pay by PromptPay transfer.
 *
 * Everything here is instructions — there is no payment gateway. The buyer
 * scans, transfers, and sends the slip; an admin checks it and confirms the
 * money arrived. Nothing on this screen may imply the order is paid, the
 * upload included: sending a slip is evidence, not a payment.
 *
 * The order number is given as the transfer reference: it is the only thing
 * tying a bank line to an order when the seller reconciles by hand.
 */
export default async function PayOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getT()
  const { id } = await params

  let order: Order
  try {
    order = await api.get<Order>(`/orders/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  // Already moving — there is nothing to pay for here.
  if (!awaitingPayment(order.status)) redirect(`/orders/${order.id}`)

  const qrUrl = env.PROMPTPAY_QR_URL

  return (
    <div className="container-page py-8 md:py-12">
      <Link
        href={`/orders/${order.id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> {t('pay.backToOrder')}
      </Link>

      <div className="mx-auto max-w-[520px]">
        <h1 className="text-[20px] font-bold md:text-[28px]">
          {t('pay.heading', { number: order.orderNumber })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{order.brand.name}</p>

        <div className="mt-6 flex flex-col items-center gap-4 rounded-[9px] border border-border p-6">
          {qrUrl ? (
            <div className="relative size-[260px] overflow-hidden rounded-[9px] bg-white">
              <Image
                src={qrUrl}
                alt={t('pay.qrAlt')}
                fill
                sizes="260px"
                className="object-contain"
                unoptimized
                priority
              />
            </div>
          ) : (
            // Better to say the QR is missing than to render a broken image.
            <div className="flex size-[260px] flex-col items-center justify-center gap-2 rounded-[9px] bg-secondary text-center">
              <QrCode
                className="size-8 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="px-6 text-xs text-muted-foreground">
                {t('pay.noQr')}
              </p>
            </div>
          )}

          <dl className="w-full border-t border-border pt-4 text-sm">
            <div className="flex items-baseline justify-between py-1">
              <dt className="text-muted-foreground">{t('pay.amount')}</dt>
              <dd className="text-[20px] font-bold text-primary">
                {formatBaht(order.totalMinor)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between py-1">
              <dt className="text-muted-foreground">{t('pay.reference')}</dt>
              <dd className="font-mono">{order.orderNumber}</dd>
            </div>
          </dl>

          <p className="w-full rounded-md bg-secondary p-3 text-xs text-muted-foreground">
            {t('pay.referenceHint')}
          </p>
        </div>

        <PaymentSlipUpload orderId={order.id} sentAt={order.paymentSlipAt} />

        <div className="mt-4 flex items-start gap-2 rounded-[9px] border border-border p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            {/* The status name is interpolated rather than written out, so it
                stays the same words as the badge on the order itself. It also
                loses the bold, which no longer has a slot to sit in. */}
            {t('pay.stillToPay', {
              status: buyerStatusLabel('PENDING', t),
            })}
          </p>
        </div>

        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href={`/orders/${order.id}`}>{t('pay.backToOrder')}</Link>
        </Button>
      </div>
    </div>
  )
}
