import { RotateCcw } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import type { ReturnRequest, ReturnStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Return Refund' }

const TONE: Record<ReturnStatus, 'warning' | 'success' | 'destructive'> = {
  REQUESTED: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'destructive',
}

const LABEL: Record<ReturnStatus, string> = {
  REQUESTED: 'Under review',
  ACCEPTED: 'Refund issued',
  REJECTED: 'Declined',
}

export default async function ReturnsPage() {
  const returns = await api.get<ReturnRequest[]>('/returns')

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-[20px] font-bold md:text-[36px]">Return Refund</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Returns can be raised once an order has been delivered.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {returns.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title="No return requests"
            description="Once an order is delivered, you can raise a return from the order page."
            action={{ label: 'Go to My Purchase', href: '/orders' }}
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
                  {LABEL[request.status]}
                </Badge>
              </header>

              <div className="flex flex-col gap-3 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Reason</p>
                  <p className="text-sm whitespace-pre-line">
                    {request.reason}
                  </p>
                </div>

                {/* The reviewer's note is why a decision is not a dead end —
                    accepted or rejected, the buyer is told the reasoning. */}
                {request.reviewNote ? (
                  <div className="rounded-md bg-secondary p-3">
                    <p className="text-xs text-muted-foreground">
                      Response{' '}
                      {request.reviewedAt
                        ? `· ${formatDate(request.reviewedAt)}`
                        : ''}
                    </p>
                    <p className="text-sm">{request.reviewNote}</p>
                  </div>
                ) : null}

                {request.status === 'ACCEPTED' ? (
                  <p className="text-sm text-success">
                    Refund of the item total has been issued to your wallet.
                  </p>
                ) : null}
              </div>

              <footer className="flex justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>Raised {formatDate(request.createdAt)}</span>
                <span>Order total {formatBaht(request.order.totalMinor)}</span>
              </footer>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
