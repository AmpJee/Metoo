import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ApiError, api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import type { Order } from '@/lib/types'
import { ReturnForm } from './return-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('returnNew.title') }
}

export default async function NewReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const t = await getT()
  const locale = await getLocale()
  const { orderId } = await searchParams
  if (!orderId) redirect('/orders')

  let order: Order
  try {
    order = await api.get<Order>(`/orders/${orderId}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  // Returns are post-delivery only. Checking here as well as on the API means
  // the buyer never fills in a form that is going to be rejected.
  if (order.status !== 'DELIVERED' && order.status !== 'SETTLED') {
    redirect(`/orders/${order.id}`)
  }

  return (
    <div className="container-page py-8 md:py-12">
      <Link
        href={`/orders/${order.id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> {t('pay.backToOrder')}
      </Link>

      <div className="max-w-[560px]">
        <h1 className="text-[20px] font-bold md:text-[32px]">
          {t('returnNew.title')}
        </h1>

        <div className="mt-6 rounded-[9px] border border-border p-4 text-sm">
          <p className="font-medium">
            {order.orderNumber} · {order.brand.name}
          </p>
          <p className="text-muted-foreground">
            {t('returnNew.delivered', {
              date: order.deliveredAt
                ? formatDate(order.deliveredAt, locale)
                : t('returnNew.deliveredRecently'),
              amount: formatBaht(order.totalMinor),
            })}
          </p>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {t('returnNew.explainer')}
        </p>

        <div className="mt-6">
          <ReturnForm orderId={order.id} />
        </div>
      </div>
    </div>
  )
}
