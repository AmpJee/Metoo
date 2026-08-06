import { RotateCcw } from 'lucide-react'
import type { Metadata } from 'next'
import { reviewReturn } from '@/app/actions/seller'
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
  REQUESTED: 'Awaiting your decision',
  ACCEPTED: 'Refunded',
  REJECTED: 'Declined',
}

export default async function SellerReturnsPage() {
  const returns = await api.get<ReturnRequest[]>('/brand/returns')
  const open = returns.filter((item) => item.status === 'REQUESTED')

  return (
    <>
      <PageHeader
        title="Returns"
        description={
          open.length > 0
            ? `${open.length} awaiting your decision`
            : 'Requests raised against your delivered orders.'
        }
      />

      <div className="flex flex-col gap-[20px]">
        {returns.length === 0 ? (
          <Card>
            <CardEmpty
              icon={RotateCcw}
              title="No return requests"
              description="A buyer can raise one once an order has been delivered."
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
                        Your response
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
