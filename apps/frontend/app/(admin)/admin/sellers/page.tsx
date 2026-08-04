import {
  FDA_STATUS_LABELS,
  PIPELINE_STATUSES,
  PIPELINE_STATUS_LABELS,
  SIZE_BAND_LABELS,
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
import type { Applicant } from '@/lib/types'
import { PipelineStatusControl } from '../pipeline-status'

export const metadata: Metadata = { title: 'Sellers' }

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
        title="Sellers"
        description="Brand pipeline, verification, and onboarding status."
      />

      <div>
        <FilterTabs
          items={[
            { href: '/admin/sellers', label: 'All', active: !status },
            ...PIPELINE_STATUSES.map((value) => ({
              href: `/admin/sellers?status=${value}`,
              label: PIPELINE_STATUS_LABELS[value],
              active: status === value,
            })),
          ]}
        />

        <Card>
          {applicants.length === 0 ? (
            <CardEmpty
              icon={Store}
              title="No brands here"
              description="Applicants appear as they sign up."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Brand</TH>
                  <TH>Contact</TH>
                  <TH>อย.</TH>
                  <TH>Size</TH>
                  <TH className="text-right">Products</TH>
                  <TH>Referral</TH>
                  <TH>Status</TH>
                  <TH>Docs</TH>
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
                          Signed up {formatDate(applicant.createdAt)}
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
                            {FDA_STATUS_LABELS[brand.fdaStatus]}
                          </Pill>
                        ) : (
                          '—'
                        )}
                      </TD>
                      <TD className="text-black/50">
                        {brand?.sizeBand
                          ? SIZE_BAND_LABELS[brand.sizeBand as SizeBand]
                          : '—'}
                      </TD>
                      <TD numeric>{brand?._count.products ?? 0}</TD>
                      <TD className="text-black/50">
                        {brand?.referralSource ?? '—'}
                      </TD>
                      <TD className="min-w-[180px]">
                        <Pill tone={TONE[applicant.status]} className="mb-2">
                          {PIPELINE_STATUS_LABELS[applicant.status]}
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
                          <FileText className="size-3.5" /> View
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
