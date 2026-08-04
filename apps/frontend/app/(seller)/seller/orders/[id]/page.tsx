import { ArrowLeft, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { transitionOrder } from '@/app/actions/seller'
import { PageHeader } from '@/components/dashboard-shell'
import { OrderActions } from '@/components/order-actions'
import { OrderTracker } from '@/components/console/order-tracker'
import { Pill } from '@/components/console/pill'
import { Table, TBody, TD, TH, THead, TR } from '@/components/console/table'
import { ApiError, api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import { statusLabel, statusPillTone } from '@/lib/order-status'
import type { BrandOrder, OrderStatus } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const order = await api.get<BrandOrder>(`/brand/orders/${id}`)
    return { title: `Order ${order.orderNumber}` }
  } catch {
    return { title: 'Order' }
  }
}

export default async function SellerOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let order: BrandOrder
  try {
    order = await api.get<BrandOrder>(`/brand/orders/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  // A Server Component cannot hand a client component an inline closure, so
  // the action is bound here and passed down.
  async function onTransition(to: OrderStatus) {
    'use server'
    return transitionOrder(id, to)
  }

  const address = order.shippingAddress

  return (
    <>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDate(order.createdAt)} · ${order.retailer.shopName}`}
        actions={
          <Pill tone={statusPillTone(order.status)}>
            {statusLabel(order.status)}
          </Pill>
        }
      />

      <div>
        <Link
          href="/seller/orders"
          className="mb-6 inline-flex items-center gap-1 text-[15px] text-black/50 hover:text-[#cb2957]"
        >
          <ArrowLeft className="size-4" /> All orders
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-8">
            <section className="rounded-[9px] bg-white p-[24px]">
              <h2 className="mb-4 text-[16px] font-semibold">
                What happens next
              </h2>
              <OrderActions
                actions={order.actions}
                onTransition={onTransition}
              />
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-[16px] font-semibold">Items</h2>
              <Table>
                <THead>
                  <TR>
                    <TH>Product</TH>
                    <TH className="text-right">Packs</TH>
                    <TH className="text-right">Unit price</TH>
                    <TH className="text-right">Line total</TH>
                  </TR>
                </THead>
                <TBody>
                  {order.items.map((item) => (
                    <TR key={item.id}>
                      <TD>
                        {item.productName}
                        <span className="block text-[13px] text-black/50">
                          {item.unitsPerPack} units/pack
                        </span>
                      </TD>
                      <TD numeric>{item.packs}</TD>
                      <TD numeric>{formatBaht(item.pricePerPackMinor)}</TD>
                      <TD numeric>{formatBaht(item.lineTotalMinor)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              {/* Names and prices are the snapshot taken at checkout, so this
                  stays truthful after the product is edited. */}
              <p className="text-[13px] text-black/50">
                Prices are those at the time the order was placed.
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-[16px] font-semibold">Tracking</h2>
              <OrderTracker status={order.status} />
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-[9px] bg-white p-[24px]">
              <h2 className="text-[16px] font-semibold">Your payout</h2>
              <dl className="mt-4 flex flex-col gap-2 text-[15px]">
                <div className="flex justify-between">
                  <dt className="text-black/50">Order total</dt>
                  <dd className="tabular-nums">
                    {formatBaht(order.totalMinor)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-black/50">
                    Commission ({(order.commissionBps / 100).toFixed(1)}%)
                  </dt>
                  <dd className="tabular-nums text-black/50">
                    −{formatBaht(order.commissionMinor)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex justify-between border-t border-black/10 pt-4 font-semibold">
                <span>You receive</span>
                <span className="tabular-nums text-[#cb2957]">
                  {formatBaht(order.payoutMinor)}
                </span>
              </div>
              {/* The rate is snapshotted at checkout and never recomputed, so
                  a later tier change cannot rewrite this order's economics. */}
              <p className="mt-3 text-[13px] text-black/50">
                Credited to your wallet when you confirm money received.
              </p>
            </div>

            <div className="rounded-[9px] bg-white p-[24px]">
              <h2 className="flex items-center gap-2 text-[16px] font-semibold">
                <MapPin className="size-4" /> Deliver to
              </h2>
              <address className="mt-3 text-[15px] not-italic text-black/50">
                <p className="font-bold text-foreground">
                  {order.retailer.shopName}
                </p>
                {address?.addressLine ? <p>{address.addressLine}</p> : null}
                <p>
                  {[address?.province, address?.postalCode]
                    .filter(Boolean)
                    .join(' ')}
                </p>
                {address?.phone ? <p>{address.phone}</p> : null}
              </address>
            </div>

            <div className="rounded-[9px] bg-white p-[24px] text-[15px]">
              <h2 className="mb-2 text-[16px] font-semibold">Payment</h2>
              <p className="text-black/50">
                {order.paymentMethod === 'PROMPTPAY'
                  ? 'PromptPay'
                  : order.paymentMethod === 'CASH'
                    ? 'Cash on delivery'
                    : 'Card'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
