import { ORDER_STATUSES, type OrderStatus } from '@metoo/shared'
import { ShoppingBag } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardEmpty } from '@/components/console/card'
import { FilterTabs } from '@/components/console/filter-tabs'
import { Pill } from '@/components/console/pill'
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TSub,
} from '@/components/console/table'
import { PageHeader } from '@/components/dashboard-shell'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import { statusLabel, statusPillTone } from '@/lib/order-status'
import { transitionOrder } from '@/app/actions/seller'
import { OrderActions } from '@/components/order-actions'
import type { BrandOrder } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('sellerOrders.title') }
}

interface Counts {
  all: number
  byStatus: Record<OrderStatus, number>
}

/**
 * The seller's order queue.
 *
 * Tabs are the raw statuses rather than the buyer's groupings, because a
 * seller tracks each stage separately even where a buyer would not.
 *
 * Most of these are now read-only to a seller: the only order they can move
 * is an Incoming one, which they accept. Package pickup, delivery and
 * settlement belong to admin and the retailer, so the buttons simply do not
 * appear — `actions` comes from the API, which knows who is asking.
 */
export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const t = await getT()
  const locale = await getLocale()
  const { status: raw } = await searchParams
  const status = ORDER_STATUSES.includes(raw as OrderStatus)
    ? (raw as OrderStatus)
    : undefined

  // One bound action per row. Defined here rather than inside the map so the
  // 'use server' directive sits in a function body, which is where Next
  // requires it.
  function transitionFor(orderId: string) {
    return async (to: OrderStatus) => {
      'use server'
      return transitionOrder(orderId, to)
    }
  }

  const [orders, counts] = await Promise.all([
    api.get<BrandOrder[]>(`/brand/orders${status ? `?status=${status}` : ''}`),
    api.get<Counts>('/brand/orders/counts'),
  ])

  return (
    <>
      <PageHeader
        title={t('sellerOrders.title')}
        description={t('sellerOrders.subtitle')}
      />

      <FilterTabs
        items={[
          {
            href: '/seller/orders',
            label: t('sellerOrders.all'),
            active: !status,
            count: counts.all,
          },
          ...ORDER_STATUSES.map((value) => ({
            href: `/seller/orders?status=${value}`,
            label: statusLabel(value, t),
            active: status === value,
            count: counts.byStatus[value],
          })),
        ]}
      />

      <Card>
        {orders.length === 0 ? (
          <CardEmpty
            icon={ShoppingBag}
            title={t('sellerOrders.emptyTitle')}
            description={t('sellerOrders.emptyBody')}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t('sellerOrders.order')}</TH>
                <TH>{t('sellerOrders.retailer')}</TH>
                <TH>{t('sellerOrders.status')}</TH>
                <TH className="text-right">{t('sellerOrders.total')}</TH>
                <TH className="text-right">{t('sellerOrders.payout')}</TH>
                <TH>{t('sellerOrders.move')}</TH>
              </TR>
            </THead>
            <TBody>
              {orders.map((order) => (
                <TR key={order.id}>
                  <TD>
                    <Link
                      href={`/seller/orders/${order.id}`}
                      className="font-bold hover:text-[#cb2957]"
                    >
                      {order.orderNumber}
                    </Link>
                    <TSub>
                      {formatDate(order.createdAt, locale)} ·{' '}
                      {t(
                        order.items.length === 1
                          ? 'sellerOrders.lineOne'
                          : 'sellerOrders.lineMany',
                        { n: order.items.length }
                      )}
                    </TSub>
                  </TD>
                  <TD>
                    {order.retailer.shopName}
                    <TSub>{order.retailer.province}</TSub>
                  </TD>
                  <TD>
                    <Pill tone={statusPillTone(order.status)}>
                      {statusLabel(order.status, t)}
                    </Pill>
                  </TD>
                  <TD numeric>{formatBaht(order.totalMinor)}</TD>
                  <TD numeric>
                    <span className="font-bold">
                      {formatBaht(order.payoutMinor)}
                    </span>
                    <TSub>
                      {t('sellerOrders.afterCommission', {
                        rate: (order.commissionBps / 100).toFixed(1),
                      })}
                    </TSub>
                  </TD>
                  {/* The same buttons as the detail page, from the same
                      `actions` array — so working through a queue does not
                      mean opening every order in turn. */}
                  <TD className="min-w-[190px]">
                    <OrderActions
                      actions={order.actions}
                      status={order.status}
                      onTransition={transitionFor(order.id)}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  )
}
