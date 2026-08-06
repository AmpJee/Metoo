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
import { statusLabel, statusPillTone } from '@/lib/order-status'
import type { BrandOrder } from '@/lib/types'

export const metadata: Metadata = { title: 'Orders' }

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
  const { status: raw } = await searchParams
  const status = ORDER_STATUSES.includes(raw as OrderStatus)
    ? (raw as OrderStatus)
    : undefined

  const [orders, counts] = await Promise.all([
    api.get<BrandOrder[]>(`/brand/orders${status ? `?status=${status}` : ''}`),
    api.get<Counts>('/brand/orders/counts'),
  ])

  return (
    <>
      <PageHeader
        title="Orders"
        description="Newest first. Accept incoming orders here; delivery and payment release are handled by Metoo and the retailer."
      />

      <FilterTabs
        items={[
          {
            href: '/seller/orders',
            label: 'All',
            active: !status,
            count: counts.all,
          },
          ...ORDER_STATUSES.map((value) => ({
            href: `/seller/orders?status=${value}`,
            label: statusLabel(value),
            active: status === value,
            count: counts.byStatus[value],
          })),
        ]}
      />

      <Card>
        {orders.length === 0 ? (
          <CardEmpty
            icon={ShoppingBag}
            title="Nothing here"
            description="Orders at this stage will show up here."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Order</TH>
                <TH>Retailer</TH>
                <TH>Status</TH>
                <TH className="text-right">Total</TH>
                <TH className="text-right">Your payout</TH>
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
                      {formatDate(order.createdAt)} · {order.items.length}{' '}
                      {order.items.length === 1 ? 'line' : 'lines'}
                    </TSub>
                  </TD>
                  <TD>
                    {order.retailer.shopName}
                    <TSub>{order.retailer.province}</TSub>
                  </TD>
                  <TD>
                    <Pill tone={statusPillTone(order.status)}>
                      {statusLabel(order.status)}
                    </Pill>
                  </TD>
                  <TD numeric>{formatBaht(order.totalMinor)}</TD>
                  <TD numeric>
                    <span className="font-bold">
                      {formatBaht(order.payoutMinor)}
                    </span>
                    <TSub>after {(order.commissionBps / 100).toFixed(1)}%</TSub>
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
