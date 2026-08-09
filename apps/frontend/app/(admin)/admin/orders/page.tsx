import { ORDER_STATUSES, type OrderStatus } from '@metoo/shared'
import { Receipt, ShoppingBag } from 'lucide-react'
import type { Metadata } from 'next'
import { adminTransitionOrder } from '@/app/actions/admin'
import { FilterTabs } from '@/components/console/filter-tabs'
import { PageHeader } from '@/components/dashboard-shell'
import { OrderActions } from '@/components/order-actions'
import { Pill } from '@/components/console/pill'
import { Card, CardEmpty } from '@/components/console/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/console/table'
import { api } from '@/lib/api'
import { getLocale, getT } from '@/lib/i18n/server'
import { formatBaht, formatDate } from '@/lib/format'
import { statusLabel, statusPillTone } from '@/lib/order-status'
import type { AdminOrder } from '@/lib/types'
import { DeliveryCostField } from './delivery-cost'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('adminOrders.title') }
}

/**
 * Every order on the platform, with both sides and the full commission
 * arithmetic — the table operations runs the business from.
 */
export default async function AdminOrdersPage({
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
        title={t('adminOrders.title')}
        description={t('adminOrders.subtitle', {
          orders: orders.length,
          gmv: formatBaht(gmv),
          commission: formatBaht(commission),
        })}
      />

      <div>
        <FilterTabs
          items={[
            {
              href: '/admin/orders',
              label: t('adminSellers.all'),
              active: !status,
            },
            ...ORDER_STATUSES.map((value) => ({
              href: `/admin/orders?status=${value}`,
              label: statusLabel(value, t),
              active: status === value,
            })),
          ]}
        />

        <Card>
          {orders.length === 0 ? (
            <CardEmpty
              icon={ShoppingBag}
              title={t('adminOrders.emptyTitle')}
              description={t('adminOrders.emptyBody')}
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t('adminOrders.order')}</TH>
                  <TH>{t('adminOrders.parties')}</TH>
                  <TH>{t('adminOrders.status')}</TH>
                  <TH className="text-right">{t('adminOrders.gmv')}</TH>
                  <TH className="text-right">{t('adminOrders.commission')}</TH>
                  <TH className="text-right">{t('adminOrders.payout')}</TH>
                  <TH>{t('adminOrders.deliveryCost')}</TH>
                  <TH>{t('adminOrders.move')}</TH>
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
                          {formatDate(order.createdAt, locale)}
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
                          {statusLabel(order.status, t)}
                        </Pill>
                        {/* The one thing that decides whether a PENDING order
                            is waiting on us or on the buyer. Shown beside the
                            status so it is answered before the Payment
                            Received button below is pressed. */}
                        {order.paymentSlipAt ? (
                          <a
                            href={`/admin/orders/${order.id}/slip`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
                          >
                            <Receipt className="size-3.5" />
                            {t('adminOrders.viewSlip')}
                          </a>
                        ) : order.status === 'PENDING' ? (
                          <span className="mt-1 block text-[13px] text-black/50">
                            {t('adminOrders.noSlip')}
                          </span>
                        ) : null}
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
