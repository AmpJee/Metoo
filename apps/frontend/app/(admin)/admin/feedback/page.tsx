import { MessageSquare } from 'lucide-react'
import type { Metadata } from 'next'
import { FilterTabs } from '@/components/console/filter-tabs'
import { PageHeader } from '@/components/dashboard-shell'
import { Pill } from '@/components/console/pill'
import { Card, CardEmpty } from '@/components/console/card'
import { api } from '@/lib/api'
import { getT } from '@/lib/i18n/server'
import { formatDate } from '@/lib/format'
import type { Feedback, FeedbackStatus } from '@/lib/types'
import { ResolveButton } from './resolve-button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('feedback.title') }
}

const STATUSES: FeedbackStatus[] = ['OPEN', 'RESOLVED']

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const t = await getT()
  const { status: raw } = await searchParams
  const status = STATUSES.includes(raw as FeedbackStatus)
    ? (raw as FeedbackStatus)
    : undefined

  const entries = await api.get<Feedback[]>(
    `/admin/feedback${status ? `?status=${status}` : ''}`
  )

  return (
    <>
      <PageHeader
        title={t('feedback.title')}
        description={t('feedback.subtitle')}
      />

      <FilterTabs
        items={[
          { href: '/admin/feedback', label: 'All', active: !status },
          {
            href: '/admin/feedback?status=OPEN',
            label: 'Open',
            active: status === 'OPEN',
          },
          {
            href: '/admin/feedback?status=RESOLVED',
            label: 'Resolved',
            active: status === 'RESOLVED',
          },
        ]}
      />

      <div className="flex flex-col gap-[20px]">
        {entries.length === 0 ? (
          <Card>
            <CardEmpty
              icon={MessageSquare}
              title={t('feedback.emptyTitle')}
              description={t('feedback.emptyBody')}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[9px] bg-white p-[24px]"
              >
                <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[15px]">
                    <Pill>{entry.authorRole}</Pill>
                    <span className="font-bold">{entry.authorLabel}</span>
                    <span className="text-[13px] text-black/50">
                      {formatDate(entry.createdAt)}
                    </span>
                  </span>
                  <Pill tone={entry.status === 'OPEN' ? 'warning' : 'success'}>
                    {entry.status === 'OPEN' ? 'Open' : 'Resolved'}
                  </Pill>
                </header>

                <p className="text-[15px] whitespace-pre-line">
                  {entry.message}
                </p>

                {entry.adminNote ? (
                  <div className="mt-3 rounded-md bg-[#f5f5f5] p-3">
                    <p className="text-[13px] text-black/50">
                      Internal note
                      {entry.resolvedAt
                        ? ` · resolved ${formatDate(entry.resolvedAt)}`
                        : ''}
                    </p>
                    <p className="text-[15px]">{entry.adminNote}</p>
                  </div>
                ) : null}

                {entry.status === 'OPEN' ? (
                  <div className="mt-4">
                    <ResolveButton id={entry.id} />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
