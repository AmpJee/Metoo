import {
  PIPELINE_STATUSES,
  type PipelineStatus,
  type SizeBand,
} from '@metoo/shared'
import { FileText, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { FilterTabs } from '@/components/console/filter-tabs'
import { PageHeader } from '@/components/dashboard-shell'
import { Pill } from '@/components/console/pill'
import { Card, CardEmpty } from '@/components/console/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/console/table'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import type { Applicant } from '@/lib/types'
import { PipelineStatusControl } from '../pipeline-status'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('adminSellers.title') }
}

const TONE: Record<
  PipelineStatus,
  'neutral' | 'warning' | 'info' | 'success' | 'danger'
> = {
  NOT_CONTACTED: 'neutral',
  CONTACTED: 'warning',
  INTERESTED: 'info',
  ONBOARDED: 'success',
  DECLINED: 'danger',
}

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const t = await getT()
  const locale = await getLocale()
  const { status: raw } = await searchParams
  const status = PIPELINE_STATUSES.includes(raw as PipelineStatus)
    ? (raw as PipelineStatus)
    : undefined

  const applicants = await api.get<Applicant[]>(
    `/admin/pipeline?role=BRAND${status ? `&status=${status}` : ''}`
  )

  return (
    <>
      <PageHeader
        title={t('adminSellers.title')}
        description={t('adminSellers.subtitle')}
      />

      <div>
        <FilterTabs
          items={[
            {
              href: '/admin/sellers',
              label: t('adminSellers.all'),
              active: !status,
            },
            ...PIPELINE_STATUSES.map((value) => ({
              href: `/admin/sellers?status=${value}`,
              label: t(`pipeline.${value}`),
              active: status === value,
            })),
          ]}
        />

        <Card>
          {applicants.length === 0 ? (
            <CardEmpty
              icon={Store}
              title={t('adminSellers.emptyTitle')}
              description={t('adminSellers.emptyBody')}
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t('adminSellers.brand')}</TH>
                  <TH>{t('adminSellers.contact')}</TH>
                  <TH>{t('adminSellers.fda')}</TH>
                  <TH>{t('adminSellers.size')}</TH>
                  <TH className="text-right">{t('adminSellers.products')}</TH>
                  <TH>{t('adminSellers.referral')}</TH>
                  <TH>{t('adminSellers.status')}</TH>
                  <TH>{t('adminSellers.docs')}</TH>
                </TR>
              </THead>
              <TBody>
                {applicants.map((applicant) => {
                  const brand = applicant.brand
                  return (
                    <TR key={applicant.id}>
                      <TD>
                        <span className="font-bold">
                          {brand?.name ?? applicant.email}
                        </span>
                        <span className="block text-[13px] text-black/50">
                          {t('adminSellers.signedUp', {
                            date: formatDate(applicant.createdAt, locale),
                          })}
                        </span>
                        {/* Internal outreach notes — never shown to the
                            applicant, unlike reviewNote. */}
                        {brand?.adminNotes ? (
                          <span className="mt-1 block max-w-[240px] text-[13px] text-black/50 italic">
                            {brand.adminNotes}
                          </span>
                        ) : null}
                      </TD>
                      <TD className="text-black/50">
                        {applicant.email}
                        <span className="block text-[13px]">
                          {brand?.phone} · {brand?.province}
                        </span>
                      </TD>
                      <TD>
                        {brand ? (
                          <Pill
                            tone={
                              brand.fdaStatus === 'YES'
                                ? 'success'
                                : brand.fdaStatus === 'PENDING'
                                  ? 'warning'
                                  : 'neutral'
                            }
                          >
                            {t(`fda.${brand.fdaStatus}`)}
                          </Pill>
                        ) : (
                          '—'
                        )}
                      </TD>
                      <TD className="text-black/50">
                        {brand?.sizeBand
                          ? t(`sizeBand.${brand.sizeBand as SizeBand}`)
                          : '—'}
                      </TD>
                      <TD numeric>{brand?._count.products ?? 0}</TD>
                      <TD className="text-black/50">
                        {brand?.referralSource ?? '—'}
                      </TD>
                      <TD className="min-w-[180px]">
                        <Pill tone={TONE[applicant.status]} className="mb-2">
                          {t(`pipeline.${applicant.status}`)}
                        </Pill>
                        <PipelineStatusControl
                          userId={applicant.id}
                          current={applicant.status}
                        />
                      </TD>
                      <TD>
                        <Link
                          href={`/admin/sellers/${applicant.id}`}
                          className="inline-flex items-center gap-1 text-[15px] text-[#cb2957] hover:underline"
                        >
                          <FileText className="size-3.5" />{' '}
                          {t('adminSellers.view')}
                        </Link>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  )
}
