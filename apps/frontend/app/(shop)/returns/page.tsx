import { RotateCcw } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import type { ReturnRequest, ReturnStatus } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('returns.title') }
}

const TONE: Record<ReturnStatus, 'warning' | 'success' | 'destructive'> = {
  REQUESTED: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'destructive',
}

export default async function ReturnsPage() {
  const t = await getT()
  const locale = await getLocale()
  const returns = await api.get<ReturnRequest[]>('/returns')

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-[20px] font-bold md:text-[36px]">
        {t('returns.title')}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('returns.subtitle')}
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {returns.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title={t('returns.emptyTitle')}
            description={t('returns.emptyBody')}
            action={{ label: t('group.goToOrders'), href: '/orders' }}
          />
        ) : (
          returns.map((request) => (
            <article
              key={request.id}
              className="rounded-[9px] border border-border"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <Link
                  href={`/orders/${request.order.id}`}
                  className="text-sm font-medium hover:text-primary"
                >
                  {request.order.orderNumber} · {request.order.brand.name}
                </Link>
                <Badge tone={TONE[request.status]}>
                  {t(`returns.${request.status}`)}
                </Badge>
              </header>

              <div className="flex flex-col gap-3 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('returns.reason')}
                  </p>
                  <p className="text-sm whitespace-pre-line">
                    {request.reason}
                  </p>
                </div>

                {/* The reviewer's note is why a decision is not a dead end —
                    accepted or rejected, the buyer is told the reasoning. */}
                {request.reviewNote ? (
                  <div className="rounded-md bg-secondary p-3">
                    <p className="text-xs text-muted-foreground">
                      {t('returns.response')}{' '}
                      {request.reviewedAt
                        ? `· ${formatDate(request.reviewedAt, locale)}`
                        : ''}
                    </p>
                    <p className="text-sm">{request.reviewNote}</p>
                  </div>
                ) : null}

                {request.status === 'ACCEPTED' ? (
                  <p className="text-sm text-success">
                    {t('returns.refunded')}
                  </p>
                ) : null}
              </div>

              <footer className="flex justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>
                  {t('returns.raised', {
                    date: formatDate(request.createdAt, locale),
                  })}
                </span>
                <span>
                  {t('returns.orderTotal', {
                    amount: formatBaht(request.order.totalMinor),
                  })}
                </span>
              </footer>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
