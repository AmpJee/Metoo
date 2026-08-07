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
import { getLocale, getT } from '@/lib/i18n/server'
import { statusLabel, statusPillTone } from '@/lib/order-status'
import type { BrandOrder, OrderStatus } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const t = await getT()
  const { id } = await params
  try {
    const order = await api.get<BrandOrder>(`/brand/orders/${id}`)
    return { title: t('sellerOrder.title', { number: order.orderNumber }) }
  } catch {
    return { title: t('sellerOrder.fallbackTitle') }
  }
}

export default async function SellerOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getT()
  const locale = await getLocale()
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
        title={t('sellerOrder.title', { number: order.orderNumber })}
        description={t('sellerOrder.subtitle', {
          date: formatDate(order.createdAt, locale),
          shop: order.retailer.shopName,
        })}
        actions={
          <Pill tone={statusPillTone(order.status)}>
            {statusLabel(order.status, t)}
          </Pill>
        }
      />

      <div>
        <Link
          href="/seller/orders"
          className="mb-6 inline-flex items-center gap-1 text-[15px] text-black/50 hover:text-[#cb2957]"
        >
          <ArrowLeft className="size-4" /> {t('sellerOrder.backToOrders')}
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-8">
            <section className="rounded-[9px] bg-white p-[24px]">
              <h2 className="mb-4 text-[16px] font-semibold">
                {t('sellerOrder.whatNext')}
              </h2>
              <OrderActions
                actions={order.actions}
                status={order.status}
                onTransition={onTransition}
              />
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-[16px] font-semibold">
                {t('sellerOrder.items')}
              </h2>
              <Table>
                <THead>
                  <TR>
                    <TH>{t('sellerOrder.product')}</TH>
                    <TH className="text-right">{t('sellerOrder.packs')}</TH>
                    <TH className="text-right">{t('sellerOrder.unitPrice')}</TH>
                    <TH className="text-right">{t('sellerOrder.lineTotal')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {order.items.map((item) => (
                    <TR key={item.id}>
                      <TD>
                        {item.productName}
                        <span className="block text-[13px] text-black/50">
                          {t('sellerOrder.unitsPerPack', {
                            n: item.unitsPerPack,
                          })}
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
                {t('sellerOrder.priceNote')}
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-[16px] font-semibold">
                {t('sellerOrder.tracking')}
              </h2>
              <OrderTracker status={order.status} />
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-[9px] bg-white p-[24px]">
              <h2 className="text-[16px] font-semibold">
                {t('sellerOrder.payout')}
              </h2>
              <dl className="mt-4 flex flex-col gap-2 text-[15px]">
                <div className="flex justify-between">
                  <dt className="text-black/50">
                    {t('sellerOrder.orderTotal')}
                  </dt>
                  <dd className="tabular-nums">
                    {formatBaht(order.totalMinor)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-black/50">
                    {t('sellerOrder.commission', {
                      rate: (order.commissionBps / 100).toFixed(1),
                    })}
                  </dt>
                  <dd className="tabular-nums text-black/50">
                    −{formatBaht(order.commissionMinor)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex justify-between border-t border-black/10 pt-4 font-semibold">
                <span>{t('sellerOrder.youReceive')}</span>
                <span className="tabular-nums text-[#cb2957]">
                  {formatBaht(order.payoutMinor)}
                </span>
              </div>
              {/* The rate is snapshotted at checkout and never recomputed, so
                  a later tier change cannot rewrite this order's economics. */}
              <p className="mt-3 text-[13px] text-black/50">
                {t('sellerOrder.payoutNote')}
              </p>
            </div>

            <div className="rounded-[9px] bg-white p-[24px]">
              <h2 className="flex items-center gap-2 text-[16px] font-semibold">
                <MapPin className="size-4" /> {t('sellerOrder.deliverTo')}
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
              <h2 className="mb-2 text-[16px] font-semibold">
                {t('sellerOrder.payment')}
              </h2>
              {/* The payment enum already has translated labels — no need to
                  restate the three cases here. */}
              <p className="text-black/50">
                {t(`payment.${order.paymentMethod}`)}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
