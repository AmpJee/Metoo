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
import type { AdminSummary, DashboardPeriod } from '@/lib/types'

export const metadata: Metadata = { title: 'Weekly Summary' }

const PERIODS = ['day', 'week', 'month', 'year'] as const

export default async function AdminSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: raw } = await searchParams
  const period = (
    PERIODS.includes(raw as DashboardPeriod) ? raw : 'week'
  ) as DashboardPeriod

  const data = await api.get<AdminSummary>(`/admin/summary?period=${period}`)

  return (
    <>
      <PageHeader
        title="Weekly Summary"
        description="GMV counts confirmed orders onward — a pending order is a request, not a sale."
        actions={<PeriodTabs basePath="/admin" active={period} />}
      />

      {/* Money. GMV leads as the headline card. */}
      <section className="grid grid-cols-1 gap-[20px] md:grid-cols-3">
        <HeroTile
          label="GMV processed"
          value={formatBaht(data.gmvMinor)}
          footnote={
            <>
              <ShoppingBag className="size-[18px]" />
              {data.orderCount} {data.orderCount === 1 ? 'order' : 'orders'}
            </>
          }
        />
        <StatTile
          label="Commission earned"
          value={formatBaht(data.commissionMinor)}
          icon={Percent}
          tint="success"
        />
      </section>

      <section className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Logistics cost"
          value={formatBaht(data.logisticsCostMinor)}
          hint="Entered per order as invoices arrive"
          icon={Truck}
          tint="warning"
        />
        <StatTile
          label="Contribution margin"
          value={formatBaht(data.contributionMarginMinor)}
          hint="Commission minus logistics"
          icon={TrendingUp}
          tint={data.contributionMarginMinor >= 0 ? 'success' : 'warning'}
        />
        <StatTile
          label="Average order value"
          value={formatBaht(data.averageOrderValueMinor)}
          icon={Receipt}
        />
        <StatTile
          label="Repeat order rate"
          value={`${data.repeatOrderRate.percent}%`}
          hint={`${data.repeatOrderRate.repeatOrders} of ${data.repeatOrderRate.totalOrders}`}
          icon={Repeat}
          tint="info"
        />
      </section>

      {/* Operations and onboarding. */}
      <section className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Avg. fulfilment time"
          value={
            data.averageFulfilmentHours === null
              ? '—'
              : `${data.averageFulfilmentHours}h`
          }
          hint={
            data.averageFulfilmentHours === null
              ? 'Nothing delivered yet'
              : 'Confirmed to delivered'
          }
          icon={Timer}
        />
        <StatTile
          label="Signup to first order"
          value={
            data.averageDaysToFirstOrder === null
              ? '—'
              : `${data.averageDaysToFirstOrder} days`
          }
          hint={
            data.averageDaysToFirstOrder === null
              ? 'No first orders yet'
              : 'Average across retailers'
          }
          icon={Clock}
          tint="warning"
        />
        <StatTile
          label="Brands onboarded"
          value={String(data.onboarding.brandsOnboarded)}
          hint={`${data.onboarding.brandsInPipeline} still in the pipeline`}
          icon={Store}
          tint="success"
        />
        <StatTile
          label="Retailers onboarded"
          value={String(data.onboarding.retailersOnboarded)}
          hint={`${data.onboarding.retailersInPipeline} still in the pipeline`}
          icon={Users}
          tint="info"
        />
      </section>

      <section>
        {data.gmvByBrand.length === 1 ? (
          // One bar is not a comparison — the number says it better.
          <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label={`GMV · ${data.gmvByBrand[0]!.name}`}
              value={formatBaht(data.gmvByBrand[0]!.gmvMinor)}
              hint="The only brand with sales this period"
              icon={Banknote}
            />
          </div>
        ) : (
          <ChartCard
            title="GMV by brand"
            total={formatBaht(data.gmvMinor)}
            empty={
              data.gmvByBrand.length === 0
                ? 'No sales in this period.'
                : undefined
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
