import { ORDER_STATUSES, type OrderStatus } from '@metoo/shared'
import { ShoppingBag } from 'lucide-react'
import type { Metadata } from 'next'
import { adminTransitionOrder } from '@/app/actions/admin'
import { FilterTabs } from '@/components/console/filter-tabs'
import { PageHeader } from '@/components/dashboard-shell'
import { OrderActions } from '@/components/order-actions'
import { Pill } from '@/components/console/pill'
import { Card, CardEmpty } from '@/components/console/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/console/table'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import { statusLabel, statusPillTone } from '@/lib/order-status'
import type { AdminOrder } from '@/lib/types'
import { DeliveryCostField } from './delivery-cost'

export const metadata: Metadata = { title: 'Orders' }

/**
 * Every order on the platform, with both sides and the full commission
 * arithmetic — the table operations runs the business from.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: raw } = await searchParams
  const status = ORDER_STATUSES.includes(raw as OrderStatus)
    ? (raw as OrderStatus)
    : undefined

  const orders = await api.get<AdminOrder[]>(
    `/admin/orders${status ? `?status=${status}` : ''}`
  )

  const gmv = orders.reduce((sum, order) => sum + order.subtotalMinor, 0)
  const commission = orders.reduce(
    (sum, order) => sum + order.commissionMinor,
    0
  )

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${orders.length} orders · ${formatBaht(gmv)} GMV · ${formatBaht(commission)} commission`}
      />

      <div>
        <FilterTabs
          items={[
            { href: '/admin/orders', label: 'All', active: !status },
            ...ORDER_STATUSES.map((value) => ({
              href: `/admin/orders?status=${value}`,
              label: statusLabel(value),
              active: status === value,
            })),
          ]}
        />

        <Card>
          {orders.length === 0 ? (
            <CardEmpty
              icon={ShoppingBag}
              title="No orders"
              description="Orders with this status will appear here."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Order</TH>
                  <TH>Brand → Retailer</TH>
                  <TH>Status</TH>
                  <TH className="text-right">GMV</TH>
                  <TH className="text-right">Commission</TH>
                  <TH className="text-right">Payout</TH>
                  <TH>Delivery cost</TH>
                  <TH>Move</TH>
                </TR>
              </THead>
              <TBody>
                {orders.map((order) => {
                  async function onTransition(to: OrderStatus) {
                    'use server'
                    return adminTransitionOrder(order.id, to)
                  }

                  return (
                    <TR key={order.id}>
                      <TD>
                        <span className="font-bold">{order.orderNumber}</span>
                        <span className="block text-[13px] text-black/50">
                          {formatDate(order.createdAt)}
                        </span>
                      </TD>
                      <TD>
                        {order.brand.name}
                        <span className="block text-[13px] text-black/50">
                          → {order.retailer.shopName}, {order.retailer.province}
                        </span>
                      </TD>
                      <TD>
                        <Pill tone={statusPillTone(order.status)}>
                          {statusLabel(order.status)}
                        </Pill>
                      </TD>
                      <TD numeric>{formatBaht(order.subtotalMinor)}</TD>
                      <TD numeric>
                        {formatBaht(order.commissionMinor)}
                        <span className="block text-[13px] text-black/50">
                          {(order.commissionBps / 100).toFixed(1)}%
                        </span>
                      </TD>
                      <TD numeric>{formatBaht(order.payoutMinor)}</TD>
                      <TD>
                        <DeliveryCostField
                          orderId={order.id}
                          currentMinor={order.deliveryCostMinor}
                        />
                      </TD>
                      <TD className="min-w-[200px]">
                        <OrderActions
                          actions={order.actions}
                          status={order.status}
                          onTransition={onTransition}
                        />
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  )
}
