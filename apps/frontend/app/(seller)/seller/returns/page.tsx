import { RotateCcw } from 'lucide-react'
import type { Metadata } from 'next'
import { reviewReturn } from '@/app/actions/seller'
import { PageHeader } from '@/components/dashboard-shell'
import { ReturnReview } from '@/components/return-review'
import { Pill } from '@/components/console/pill'
import { Card, CardEmpty } from '@/components/console/card'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import type { ReturnRequest, ReturnStatus } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('sellerReturns.title') }
}

const TONE: Record<ReturnStatus, 'warning' | 'success' | 'danger'> = {
  REQUESTED: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
}

export default async function SellerReturnsPage() {
  const t = await getT()
  const locale = await getLocale()
  const returns = await api.get<ReturnRequest[]>('/brand/returns')
  const open = returns.filter((item) => item.status === 'REQUESTED')

  return (
    <>
      <PageHeader
        title={t('sellerReturns.title')}
        description={
          open.length > 0
            ? t('sellerReturns.awaiting', { n: open.length })
            : t('sellerReturns.subtitle')
        }
      />

      <div className="flex flex-col gap-[20px]">
        {returns.length === 0 ? (
          <Card>
            <CardEmpty
              icon={RotateCcw}
              title={t('sellerReturns.emptyTitle')}
              description={t('sellerReturns.emptyBody')}
            />
          </Card>
        ) : (
          returns.map((request) => {
            // Bound per row so the client component gets a plain action.
            async function onReview(
              decision: 'accept' | 'reject',
              note: string
            ) {
              'use server'
              return reviewReturn(request.id, decision, note || undefined)
            }

            return (
              <article key={request.id} className="rounded-[9px] bg-white">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-3">
                  <span className="text-[15px] font-bold">
                    {request.order.orderNumber} ·{' '}
                    {request.order.retailer.shopName}
                  </span>
                  <Pill tone={TONE[request.status]}>
                    {t(`sellerReturns.${request.status}`)}
                  </Pill>
                </header>

                <div className="flex flex-col gap-4 px-4 py-4">
                  <div>
                    <p className="text-[13px] text-black/50">
                      {t('sellerReturns.reasonRaised', {
                        date: formatDate(request.createdAt, locale),
                      })}
                    </p>
                    <p className="text-[15px] whitespace-pre-line">
                      {request.reason}
                    </p>
                  </div>

                  {request.status === 'REQUESTED' ? (
                    <ReturnReview onReview={onReview} />
                  ) : request.reviewNote ? (
                    <div className="rounded-md bg-[#f5f5f5] p-3">
                      <p className="text-[13px] text-black/50">
                        {t('sellerReturns.yourResponse')}
                        {request.reviewedAt
                          ? ` · ${formatDate(request.reviewedAt, locale)}`
                          : ''}
                      </p>
                      <p className="text-[15px]">{request.reviewNote}</p>
                    </div>
                  ) : null}
                </div>

                <footer className="flex justify-between border-t border-black/10 px-4 py-3 text-[13px] text-black/50">
                  <span>{t('sellerReturns.orderTotal')}</span>
                  <span className="tabular-nums">
                    {formatBaht(request.order.totalMinor)}
                  </span>
                </footer>
              </article>
            )
          })
        )}
      </div>
    </>
  )
}
