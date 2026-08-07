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
import { getLocale, getT } from '@/lib/i18n/server'
import { statusLabel, statusPillTone } from '@/lib/order-status'
import type {
  BrandDashboard,
  DashboardPeriod,
  WalletBalance,
} from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('sellerHome.title') }
}

const PERIODS = ['day', 'week', 'month', 'year'] as const

export default async function SellerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const t = await getT()
  const locale = await getLocale()
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
        title={t('sellerHome.title')}
        description={
          data.store.memberSince
            ? t('sellerHome.memberSince', {
                name: data.store.name,
                date: formatDate(data.store.memberSince, locale),
              })
            : data.store.name
        }
        actions={<PeriodTabs basePath="/seller" active={period} />}
      />

      {/* Wallet — the crimson headline card beside pending clearance. */}
      <section className="grid grid-cols-1 gap-[20px] md:grid-cols-3">
        <HeroTile
          label={t('sellerHome.availableBalance')}
          value={formatBaht(wallet.availableMinor)}
          action={
            <Link
              href="/seller/wallet"
              className="rounded-[6px] bg-white px-[28px] py-[12px] text-[16px] font-bold text-[#cb2957] transition-opacity hover:opacity-90"
            >
              {t('sellerHome.withdraw')}
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
                {t('sellerHome.noBankAccount')}
              </>
            )
          }
        />

        <StatTile
          label={t('sellerHome.pendingClearance')}
          value={formatBaht(wallet.pendingClearanceMinor)}
          hint={t('sellerHome.pendingClearanceHint')}
          icon={Clock}
          tint="warning"
        />
      </section>

      {/* Trading metrics. */}
      <section className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t('sellerHome.aov')}
          value={formatBaht(data.averageOrderValueMinor)}
          icon={Receipt}
        />
        <StatTile
          label={t('sellerHome.newOrders')}
          value={String(data.store.newOrders)}
          hint={t('sellerHome.newOrdersHint')}
          icon={ShoppingBag}
          tint={data.store.newOrders > 0 ? 'warning' : 'primary'}
        />
        <StatTile
          label={t('sellerHome.activeProducts')}
          value={String(data.store.activeProducts)}
          hint={t('sellerHome.activeProductsHint', {
            n: data.store.totalProducts,
          })}
          icon={Package}
          tint="success"
        />
        <StatTile
          label={t('sellerHome.repeatRate')}
          value={`${data.repeatOrderRate.percent}%`}
          hint={t('sellerHome.repeatRateHint', {
            repeat: data.repeatOrderRate.repeatOrders,
            total: data.repeatOrderRate.totalOrders,
          })}
          icon={Repeat}
          tint="info"
        />
      </section>

      {/* Two measures, two plots — never two y-axes on one. */}
      <section className="grid grid-cols-1 gap-[20px] lg:grid-cols-2">
        <ChartCard
          title={t('sellerHome.revenue')}
          total={formatBaht(data.revenueMinor)}
          empty={
            data.chart.length < 2 ? t('sellerHome.revenueEmpty') : undefined
          }
        >
          <RevenueChart data={data.chart} />
        </ChartCard>

        <ChartCard
          title={t('sellerHome.orderQuantities')}
          total={String(totalOrders)}
          empty={
            data.chart.length < 2
              ? t('sellerHome.orderQuantitiesEmpty')
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
            <h2 className="text-[20px] font-bold text-black">
              {t('sellerHome.newOrders')}
            </h2>
            <Link
              href="/seller/orders"
              className="text-[15px] text-[#cb2957] hover:underline"
            >
              {t('sellerHome.allOrders')}
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <p className="py-[24px] text-center text-[15px] text-black/50">
              {t('sellerHome.noOrders')}
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
                      {formatDate(order.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-[12px]">
                    <Pill tone={statusPillTone(order.status)}>
                      {statusLabel(order.status, t)}
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
            <h2 className="text-[20px] font-bold text-black">
              {t('sellerHome.stock')}
            </h2>
            <Link
              href="/seller/products"
              className="text-[15px] text-[#cb2957] hover:underline"
            >
              {t('sellerHome.allProducts')}
            </Link>
          </div>

          {/* The API flags which lines need restocking, so this does not
              re-derive a threshold the backend already owns. */}
          {needsAttention.length === 0 ? (
            <p className="py-[24px] text-center text-[15px] text-black/50">
              {t('sellerHome.stockOk')}
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
                      ? t('product.madeToOrder')
                      : t('product.stockPacks', { n: item.stockPacks })}
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
