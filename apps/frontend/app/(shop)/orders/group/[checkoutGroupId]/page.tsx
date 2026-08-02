import { CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrderCard } from '@/components/order-card'
import { Button } from '@/components/ui/button'
import { ApiError, api } from '@/lib/api'
import { formatBaht } from '@/lib/format'
import type { OrderGroup } from '@/lib/types'

export const metadata: Metadata = { title: 'Order placed' }

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
            <p className="font-medium">
              Order placed! Thank you for shopping with metoo.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length === 1
                ? 'The brand will confirm your order shortly.'
                : `Your cart spanned ${orders.length} brands, so it was placed as ${orders.length} separate orders. Each is confirmed and delivered on its own.`}{' '}
              No payment has been taken yet — you will arrange that with the
              brand once they confirm.
            </p>
          </div>
        </div>
      ) : (
        <h1 className="mb-6 text-[20px] font-bold md:text-[32px]">
          Orders from this checkout
        </h1>
      )}

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[9px] border border-border p-5">
        <span className="text-sm text-muted-foreground">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
        </span>
        <span className="text-base font-semibold">{formatBaht(total)}</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/orders">Go to My Purchase</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/explore">Continue shopping</Link>
        </Button>
      </div>
    </div>
  )
}
