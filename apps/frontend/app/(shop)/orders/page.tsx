import { Package } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { OrderCard } from '@/components/order-card'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { getT } from '@/lib/i18n/server'
import { PURCHASE_TABS, tabFor } from '@/lib/order-status'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('orders.title') }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const t = await getT()
  const { tab: tabKey } = await searchParams
  const tab = tabFor(tabKey)

  // One unfiltered fetch, filtered per tab in memory. The API takes a single
  // ?status=, but most tabs cover two states — fetching once and filtering
  // here avoids N round-trips and keeps the tab counts consistent.
  const orders = await api.get<Order[]>('/orders')

  const visible = tab.statuses
    ? orders.filter((order) =>
        (tab.statuses as readonly string[]).includes(order.status)
      )
    : orders

  const countFor = (statuses: readonly string[] | null) =>
    statuses
      ? orders.filter((order) => statuses.includes(order.status)).length
      : orders.length

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-[20px] font-bold md:text-[36px]">
        {t('orders.title')}
      </h1>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {PURCHASE_TABS.map((item) => {
          const active = item.key === tab.key
          const count = countFor(item.statuses)
          return (
            <Link
              key={item.key}
              href={item.key === 'all' ? '/orders' : `/orders?tab=${item.key}`}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm transition-colors',
                active
                  ? 'border-primary font-medium text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t(item.labelKey)}
              {count > 0 ? (
                <span className="text-xs text-muted-foreground">({count})</span>
              ) : null}
            </Link>
          )
        })}
        <Link
          href="/returns"
          className="flex shrink-0 items-center border-b-2 border-transparent px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('orders.tab.returns')}
        </Link>
      </nav>

      <div className="mt-6 flex flex-col gap-4">
        {visible.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('orders.emptyTitle')}
            description={t('orders.emptyBody')}
            action={{ label: t('orders.startShopping'), href: '/explore' }}
          />
        ) : (
          visible.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  )
}
