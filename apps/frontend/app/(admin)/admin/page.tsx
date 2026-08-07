import {
  Banknote,
  Clock,
  Percent,
  Receipt,
  Repeat,
  ShoppingBag,
  Store,
  Timer,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react'
import type { Metadata } from 'next'
import { GmvByBrandChart } from '@/components/charts/gmv-by-brand-chart'
import { PageHeader } from '@/components/dashboard-shell'
import { PeriodTabs } from '@/components/period-tabs'
import { ChartCard } from '@/components/console/chart-card'
import { HeroTile, StatTile } from '@/components/console/stat-tile'
import { api } from '@/lib/api'
import { formatBaht } from '@/lib/format'
import { getT } from '@/lib/i18n/server'
import type { AdminSummary, DashboardPeriod } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('adminHome.title') }
}

const PERIODS = ['day', 'week', 'month', 'year'] as const

export default async function AdminSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const t = await getT()
  const { period: raw } = await searchParams
  const period = (
    PERIODS.includes(raw as DashboardPeriod) ? raw : 'week'
  ) as DashboardPeriod

  const data = await api.get<AdminSummary>(`/admin/summary?period=${period}`)

  return (
    <>
      <PageHeader
        title={t('adminHome.title')}
        description={t('adminHome.subtitle')}
        actions={<PeriodTabs basePath="/admin" active={period} />}
      />

      {/* Money. GMV leads as the headline card. */}
      <section className="grid grid-cols-1 gap-[20px] md:grid-cols-3">
        <HeroTile
          label={t('adminHome.gmv')}
          value={formatBaht(data.gmvMinor)}
          footnote={
            <>
              <ShoppingBag className="size-[18px]" />
              {t(
                data.orderCount === 1
                  ? 'adminHome.orderOne'
                  : 'adminHome.orderMany',
                { n: data.orderCount }
              )}
            </>
          }
        />
        <StatTile
          label={t('adminHome.commission')}
          value={formatBaht(data.commissionMinor)}
          icon={Percent}
          tint="success"
        />
      </section>

      <section className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={t('adminHome.logistics')}
          value={formatBaht(data.logisticsCostMinor)}
          hint={t('adminHome.logisticsHint')}
          icon={Truck}
          tint="warning"
        />
        <StatTile
          label={t('adminHome.margin')}
          value={formatBaht(data.contributionMarginMinor)}
          hint={t('adminHome.marginHint')}
          icon={TrendingUp}
          tint={data.contributionMarginMinor >= 0 ? 'success' : 'warning'}
        />
        <StatTile
          label={t('adminHome.aov')}
          value={formatBaht(data.averageOrderValueMinor)}
          icon={Receipt}
        />
        <StatTile
          label={t('adminHome.repeatRate')}
          value={`${data.repeatOrderRate.percent}%`}
          hint={t('adminHome.repeatRateHint', {
            repeat: data.repeatOrderRate.repeatOrders,
            total: data.repeatOrderRate.totalOrders,
          })}
          icon={Repeat}
          tint="info"
        />
      </section>

      {/* Operations and onboarding. */}
      <section className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={t('adminHome.fulfilment')}
          value={
            data.averageFulfilmentHours === null
              ? '—'
              : t('adminHome.fulfilmentValue', {
                  n: data.averageFulfilmentHours,
                })
          }
          hint={t(
            data.averageFulfilmentHours === null
              ? 'adminHome.fulfilmentNone'
              : 'adminHome.fulfilmentHint'
          )}
          icon={Timer}
        />
        <StatTile
          label={t('adminHome.toFirstOrder')}
          value={
            data.averageDaysToFirstOrder === null
              ? '—'
              : t('adminHome.toFirstOrderValue', {
                  n: data.averageDaysToFirstOrder,
                })
          }
          hint={t(
            data.averageDaysToFirstOrder === null
              ? 'adminHome.toFirstOrderNone'
              : 'adminHome.toFirstOrderHint'
          )}
          icon={Clock}
          tint="warning"
        />
        <StatTile
          label={t('adminHome.brandsOnboarded')}
          value={String(data.onboarding.brandsOnboarded)}
          hint={t('adminHome.brandsPipeline', {
            n: data.onboarding.brandsInPipeline,
          })}
          icon={Store}
          tint="success"
        />
        <StatTile
          label={t('adminHome.retailersOnboarded')}
          value={String(data.onboarding.retailersOnboarded)}
          hint={t('adminHome.retailersPipeline', {
            n: data.onboarding.retailersInPipeline,
          })}
          icon={Users}
          tint="info"
        />
      </section>

      <section>
        {data.gmvByBrand.length === 1 ? (
          // One bar is not a comparison — the number says it better.
          <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label={t('adminHome.gmvForBrand', {
                name: data.gmvByBrand[0]!.name,
              })}
              value={formatBaht(data.gmvByBrand[0]!.gmvMinor)}
              hint={t('adminHome.onlyBrand')}
              icon={Banknote}
            />
          </div>
        ) : (
          <ChartCard
            title={t('adminHome.gmvByBrand')}
            total={formatBaht(data.gmvMinor)}
            empty={
              data.gmvByBrand.length === 0 ? t('adminHome.noSales') : undefined
            }
          >
            <GmvByBrandChart data={data.gmvByBrand} />
          </ChartCard>
        )}
      </section>

      {/* The design also shows GMV trending over time and a split by
          category. Neither is built: GET /admin/summary returns one period's
          totals plus gmvByBrand — no bucketed series and no category
          breakdown. Adding them means extending that endpoint, the way
          brand-dashboard already returns `chart[]`. Inventing a trend from a
          single total would be a chart that lies. */}
    </>
  )
}
