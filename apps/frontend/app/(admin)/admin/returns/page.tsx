import { RotateCcw } from 'lucide-react'
import type { Metadata } from 'next'
import { adminReviewReturn } from '@/app/actions/admin'
import { PageHeader } from '@/components/dashboard-shell'
import { ReturnReview } from '@/components/return-review'
import { Pill } from '@/components/console/pill'
import { Card, CardEmpty } from '@/components/console/card'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import type { ReturnRequest, ReturnStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Returns' }

const TONE: Record<ReturnStatus, 'warning' | 'success' | 'danger'> = {
  REQUESTED: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
}

const LABEL: Record<ReturnStatus, string> = {
  REQUESTED: 'Awaiting review',
  ACCEPTED: 'Refunded',
  REJECTED: 'Declined',
}

/**
 * Every return on the platform.
 *
 * The brand reviews its own returns first; admin can step in — for a dispute,
 * or a brand that has gone quiet. Accepting refunds the buyer, debits the
 * brand's wallet and closes the order.
 */
export default async function AdminReturnsPage() {
  const returns = await api.get<ReturnRequest[]>('/admin/returns')
  const open = returns.filter((item) => item.status === 'REQUESTED')

  return (
    <>
      <PageHeader
        title="Returns"
        description={
          open.length > 0
            ? `${open.length} awaiting a decision`
            : 'Every return request across the platform.'
        }
      />

      <div className="flex flex-col gap-[20px]">
        {returns.length === 0 ? (
          <Card>
            <CardEmpty
              icon={RotateCcw}
              title="No return requests"
              description="Returns can only be raised after delivery."
            />
          </Card>
        ) : (
          returns.map((request) => {
            async function onReview(
              decision: 'accept' | 'reject',
              note: string
            ) {
              'use server'
              return adminReviewReturn(request.id, decision, note || undefined)
            }

            return (
              <article key={request.id} className="rounded-[9px] bg-white">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-3">
                  <span className="text-[15px]">
                    <span className="font-bold">
                      {request.order.orderNumber}
                    </span>
                    <span className="text-black/50">
                      {' '}
                      · {request.order.brand.name} →{' '}
                      {request.order.retailer.shopName}
                    </span>
                  </span>
                  <Pill tone={TONE[request.status]}>
                    {LABEL[request.status]}
                  </Pill>
                </header>

                <div className="flex flex-col gap-4 px-4 py-4">
                  <div>
                    <p className="text-[13px] text-black/50">
                      Reason · raised {formatDate(request.createdAt)}
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
                        Decision
                        {request.reviewedAt
                          ? ` · ${formatDate(request.reviewedAt)}`
                          : ''}
                      </p>
                      <p className="text-[15px]">{request.reviewNote}</p>
                    </div>
                  ) : null}
                </div>

                <footer className="flex justify-between border-t border-black/10 px-4 py-3 text-[13px] text-black/50">
                  <span>Order total</span>
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
