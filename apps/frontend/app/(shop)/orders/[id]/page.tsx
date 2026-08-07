import { ArrowLeft, MapPin, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ConfirmDeliveredButton } from '@/components/confirm-delivered-button'
import { OrderItemReview } from '@/components/order-item-review'
import { OrderTracker } from '@/components/order-tracker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ApiError, api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import {
  awaitingBuyerConfirmation,
  awaitingPayment,
  buyerStatusLabel,
  statusTone,
} from '@/lib/order-status'
import type { Order, OwnReview } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const t = await getT()
  const { id } = await params
  try {
    const order = await api.get<Order>(`/orders/${id}`)
    return { title: t('order.title', { number: order.orderNumber }) }
  } catch {
    return { title: t('order.fallbackTitle') }
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getT()
  const locale = await getLocale()
  const { id } = await params

  let order: Order
  try {
    order = await api.get<Order>(`/orders/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  // Returns are post-delivery only — the API rejects a request against an
  // order that has not reached DELIVERED or SETTLED.
  const canRequestReturn =
    order.status === 'DELIVERED' || order.status === 'SETTLED'

  // Reviewing needs the same delivered order the API checks for, so the
  // section appears exactly when the rating would be accepted. One request per
  // line item, in parallel — an order has a handful of items, not hundreds.
  const reviews = canRequestReturn
    ? await Promise.all(
        order.items.map(async (item) => {
          try {
            const own = await api.get<OwnReview>(
              `/products/${item.productId}/reviews/mine`
            )
            return { item, own }
          } catch {
            // A deleted product should not take the whole order page down.
            return { item, own: { canReview: false, review: null } }
          }
        })
      )
    : []

  const reviewable = reviews.filter((entry) => entry.own.canReview)

  const address = order.shippingAddress

  return (
    <div className="container-page py-8 md:py-12">
      <Link
        href="/orders"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> {t('orders.title')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[20px] font-bold md:text-[32px]">
            {t('order.title', { number: order.orderNumber })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('order.placed', { date: formatDate(order.createdAt, locale) })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={statusTone(order.status)}>
            {buyerStatusLabel(order.status, t)}
          </Badge>
          {/* The whole point of "To Pay" — somewhere to go and pay. */}
          {awaitingPayment(order.status) ? (
            <Button asChild>
              <Link href={`/orders/${order.id}/pay`}>{t('orders.pay')}</Link>
            </Button>
          ) : null}
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-semibold">{t('order.track')}</h2>
            <OrderTracker status={order.status} />
          </section>

          {reviewable.length > 0 ? (
            <section className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">
                {t('order.rateTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('order.rateSubtitle')}
              </p>
              <div className="mt-2 divide-y divide-border rounded-[9px] border border-border px-4">
                {reviewable.map(({ item, own }) => (
                  <OrderItemReview
                    key={item.id}
                    productId={item.productId}
                    productName={item.productName}
                    existing={own.review}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">
              {t('order.productsOrdered')}
            </h2>
            <div className="rounded-[9px] border border-border">
              <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium">
                <Store className="size-4" />
                <Link
                  href={`/stores/${order.brand.id}`}
                  className="hover:text-primary"
                >
                  {order.brand.name}
                </Link>
              </header>
              <ul className="divide-y divide-border">
                {order.items.map((item) => (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex justify-between gap-4 text-sm">
                      <Link
                        href={`/products/${item.productId}`}
                        className="hover:text-primary"
                      >
                        {item.productName}
                      </Link>
                      <span className="shrink-0 tabular-nums">
                        {formatBaht(item.lineTotalMinor)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('order.lineDetail', {
                        price: formatBaht(item.pricePerPackMinor),
                        packs: item.packs,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            {/* Prices here are the snapshot taken at checkout, so this stays
                truthful even after the brand edits the product. */}
            <p className="text-xs text-muted-foreground">
              {t('order.priceNote')}
            </p>
          </section>
        </div>

        <aside className="flex h-fit flex-col gap-4">
          <div className="rounded-[9px] border border-border p-5">
            <h2 className="text-base font-semibold">
              {t('orders.orderTotal')}
            </h2>
            <dl className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('order.subtotal')}</dt>
                <dd>{formatBaht(order.subtotalMinor)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('order.shipping')}</dt>
                <dd>{formatBaht(order.shippingMinor)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold">
              <span>{t('order.total')}</span>
              <span className="text-primary">
                {formatBaht(order.totalMinor)}
              </span>
            </div>
          </div>

          {address ? (
            <div className="rounded-[9px] border border-border p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <MapPin className="size-4" /> {t('order.deliveryAddress')}
              </h2>
              <address className="mt-3 text-sm not-italic text-muted-foreground">
                {address.addressLine ? <p>{address.addressLine}</p> : null}
                <p>
                  {[address.province, address.postalCode]
                    .filter(Boolean)
                    .join(' ')}
                </p>
                {address.phone ? <p>{address.phone}</p> : null}
              </address>
            </div>
          ) : null}

          {/* Step 5 -> 6. The one move the buyer owns. */}
          {awaitingBuyerConfirmation(order.status) ? (
            <ConfirmDeliveredButton orderId={order.id} />
          ) : null}

          {canRequestReturn ? (
            <Button asChild variant="outline">
              <Link href={`/returns/new?orderId=${order.id}`}>
                {t('order.requestReturn')}
              </Link>
            </Button>
          ) : null}

          <Button asChild variant="ghost">
            <Link href={`/orders/group/${order.checkoutGroupId}`}>
              {t('order.viewGroup')}
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  )
}
