import {
  AlertTriangle,
  Clock,
  Package,
  Receipt,
  Repeat,
  ShoppingBag,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { OrderCountChart } from '@/components/charts/order-count-chart'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { PageHeader } from '@/components/dashboard-shell'
import { PeriodTabs } from '@/components/period-tabs'
import { Pill } from '@/components/console/pill'
import { ChartCard } from '@/components/console/chart-card'
import { HeroTile, StatTile } from '@/components/console/stat-tile'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import { statusLabel, statusPillTone } from '@/lib/order-status'
import type {
  BrandDashboard,
  DashboardPeriod,
  WalletBalance,
} from '@/lib/types'

export const metadata: Metadata = { title: 'Seller dashboard' }

const PERIODS = ['day', 'week', 'month', 'year'] as const

export default async function SellerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: raw } = await searchParams
  const period = (
    PERIODS.includes(raw as DashboardPeriod) ? raw : 'week'
  ) as DashboardPeriod

  // The wallet balance is not on the dashboard response, and the design leads
  // with it — so both, in parallel.
  const [data, wallet] = await Promise.all([
    api.get<BrandDashboard>(`/brand/dashboard?period=${period}`),
    api.get<WalletBalance>('/wallet'),
  ])

  const needsAttention = data.stock.filter((item) => item.needsAttention)
  const totalOrders = data.chart.reduce((sum, point) => sum + point.count, 0)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          data.store.memberSince
            ? `${data.store.name} · member since ${formatDate(data.store.memberSince)}`
            : data.store.name
        }
        actions={<PeriodTabs basePath="/seller" active={period} />}
      />

      {/* Wallet — the crimson headline card beside pending clearance. */}
      <section className="grid grid-cols-1 gap-[20px] md:grid-cols-3">
        <HeroTile
          label="Available balance"
          value={formatBaht(wallet.availableMinor)}
          action={
            <Link
              href="/seller/wallet"
              className="rounded-[6px] bg-white px-[28px] py-[12px] text-[16px] font-bold text-[#cb2957] transition-opacity hover:opacity-90"
            >
              Withdraw
            </Link>
          }
          footnote={
            wallet.bankAccountLast4 ? (
              <>
                <Receipt className="size-[18px]" />
                {wallet.bankName} ····{wallet.bankAccountLast4}
              </>
            ) : (
              <>
                <AlertTriangle className="size-[18px]" />
                No bank account on file
              </>
            )
          }
        />

        <StatTile
          label="Pending clearance"
          value={formatBaht(wallet.pendingClearanceMinor)}
          hint="Delivered, awaiting Money Received"
          icon={Clock}
          tint="warning"
        />
      </section>

      {/* Trading metrics. */}
      <section className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Average Order Value"
          value={formatBaht(data.averageOrderValueMinor)}
          icon={Receipt}
        />
        <StatTile
          label="New orders"
          value={String(data.store.newOrders)}
          hint="Waiting for you to confirm"
          icon={ShoppingBag}
          tint={data.store.newOrders > 0 ? 'warning' : 'primary'}
        />
        <StatTile
          label="Active products"
          value={String(data.store.activeProducts)}
          hint={`${data.store.totalProducts} listed in total`}
          icon={Package}
          tint="success"
        />
        <StatTile
          label="Repeat order rate"
          value={`${data.repeatOrderRate.percent}%`}
          hint={`${data.repeatOrderRate.repeatOrders} of ${data.repeatOrderRate.totalOrders} · trailing 12 months`}
          icon={Repeat}
          tint="info"
        />
      </section>

      {/* Two measures, two plots — never two y-axes on one. */}
      <section className="grid grid-cols-1 gap-[20px] lg:grid-cols-2">
        <ChartCard
          title="Revenue"
          total={formatBaht(data.revenueMinor)}
          empty={
            data.chart.length < 2
              ? 'Not enough history to plot — a trend needs more than one period.'
              : undefined
          }
        >
          <RevenueChart data={data.chart} />
        </ChartCard>

        <ChartCard
          title="Order Quantities"
          total={String(totalOrders)}
          empty={
            data.chart.length < 2
              ? 'Not enough history to plot yet.'
              : undefined
          }
        >
          <OrderCountChart data={data.chart} />
        </ChartCard>
      </section>

      {/* Recent orders and anything running low. */}
      <section className="grid grid-cols-1 gap-[20px] lg:grid-cols-2">
        <div className="flex flex-col gap-[16px] rounded-[9px] bg-white p-[24px]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[20px] font-bold text-black">New orders</h2>
            <Link
              href="/seller/orders"
              className="text-[15px] text-[#cb2957] hover:underline"
            >
              All orders
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <p className="py-[24px] text-center text-[15px] text-black/50">
              No orders yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {data.recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-[12px] border-b border-black/5 py-[12px] last:border-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/seller/orders/${order.id}`}
                      className="text-[16px] font-bold hover:text-[#cb2957]"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-[14px] text-black/50">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-[12px]">
                    <Pill tone={statusPillTone(order.status)}>
                      {statusLabel(order.status)}
                    </Pill>
                    <span className="text-[16px] font-bold tabular-nums">
                      {formatBaht(order.totalMinor)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-[16px] rounded-[9px] bg-white p-[24px]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[20px] font-bold text-black">Stock</h2>
            <Link
              href="/seller/products"
              className="text-[15px] text-[#cb2957] hover:underline"
            >
              All products
            </Link>
          </div>

          {/* The API flags which lines need restocking, so this does not
              re-derive a threshold the backend already owns. */}
          {needsAttention.length === 0 ? (
            <p className="py-[24px] text-center text-[15px] text-black/50">
              Every product is in stock.
            </p>
          ) : (
            <ul className="flex flex-col">
              {needsAttention.slice(0, 6).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-[12px] border-b border-black/5 py-[12px] last:border-0"
                >
                  <Link
                    href={`/seller/products/${item.id}`}
                    className="truncate text-[16px] hover:text-[#cb2957]"
                  >
                    {item.name}
                  </Link>
                  <span className="shrink-0 text-[15px] text-[#c47f00] tabular-nums">
                    {item.stockPacks === null
                      ? 'Made to order'
                      : `${item.stockPacks} packs`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
