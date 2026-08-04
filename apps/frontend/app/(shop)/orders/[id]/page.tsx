import { ArrowLeft, MapPin, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrderTracker } from '@/components/order-tracker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ApiError, api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import {
  awaitingPayment,
  buyerStatusLabel,
  statusTone,
} from '@/lib/order-status'
import type { Order } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const order = await api.get<Order>(`/orders/${id}`)
    return { title: `Order ${order.orderNumber}` }
  } catch {
    return { title: 'Order' }
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  const address = order.shippingAddress

  return (
    <div className="container-page py-8 md:py-12">
      <Link
        href="/orders"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> My Purchase
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[20px] font-bold md:text-[32px]">
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={statusTone(order.status)}>
            {buyerStatusLabel(order.status)}
          </Badge>
          {/* The whole point of "To Pay" — somewhere to go and pay. */}
          {awaitingPayment(order.status) ? (
            <Button asChild>
              <Link href={`/orders/${order.id}/pay`}>Pay</Link>
            </Button>
          ) : null}
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-semibold">Track</h2>
            <OrderTracker status={order.status} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">Products Ordered</h2>
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
                      {formatBaht(item.pricePerPackMinor)} × {item.packs} packs
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            {/* Prices here are the snapshot taken at checkout, so this stays
                truthful even after the brand edits the product. */}
            <p className="text-xs text-muted-foreground">
              Prices shown are those at the time the order was placed.
            </p>
          </section>
        </div>

        <aside className="flex h-fit flex-col gap-4">
          <div className="rounded-[9px] border border-border p-5">
            <h2 className="text-base font-semibold">Order Total</h2>
            <dl className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatBaht(order.subtotalMinor)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{formatBaht(order.shippingMinor)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">
                {formatBaht(order.totalMinor)}
              </span>
            </div>
          </div>

          {address ? (
            <div className="rounded-[9px] border border-border p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <MapPin className="size-4" /> Delivery Address
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

          {canRequestReturn ? (
            <Button asChild variant="outline">
              <Link href={`/returns/new?orderId=${order.id}`}>
                Request a return
              </Link>
            </Button>
          ) : null}

          <Button asChild variant="ghost">
            <Link href={`/orders/group/${order.checkoutGroupId}`}>
              View all orders from this checkout
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  )
}
