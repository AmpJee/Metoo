import { CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrderCard } from '@/components/order-card'
import { Button } from '@/components/ui/button'
import { ApiError, api } from '@/lib/api'
import { formatBaht } from '@/lib/format'
import { getT } from '@/lib/i18n/server'
import type { OrderGroup } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('group.title') }
}

/**
 * Every order created by one checkout.
 *
 * This doubles as the post-checkout confirmation (`?placed=1`), which is why
 * a multi-brand split is explained here rather than being a surprise in the
 * orders list.
 */
export default async function CheckoutGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ checkoutGroupId: string }>
  searchParams: Promise<{ placed?: string }>
}) {
  const t = await getT()
  const { checkoutGroupId } = await params
  const { placed } = await searchParams

  let group: OrderGroup
  try {
    group = await api.get<OrderGroup>(`/orders/group/${checkoutGroupId}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  const { orders, totalMinor: total } = group
  if (orders.length === 0) notFound()

  return (
    <div className="container-page py-8 md:py-12">
      {placed ? (
        <div className="mb-8 flex items-start gap-3 rounded-[9px] border border-success/30 bg-success/5 p-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="font-medium">{t('group.placed')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length === 1
                ? t('group.oneBrand')
                : t('group.manyBrands', { n: orders.length })}{' '}
              {t('group.noPaymentYet')}
            </p>
          </div>
        </div>
      ) : (
        <h1 className="mb-6 text-[20px] font-bold md:text-[32px]">
          {t('group.heading')}
        </h1>
      )}

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[9px] border border-border p-5">
        <span className="text-sm text-muted-foreground">
          {t(orders.length === 1 ? 'group.countOne' : 'group.countMany', {
            n: orders.length,
          })}
        </span>
        <span className="text-base font-semibold">{formatBaht(total)}</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/orders">{t('group.goToOrders')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">{t('cart.continue')}</Link>
        </Button>
      </div>
    </div>
  )
}
