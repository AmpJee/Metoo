import {
  PAYMENT_PREFERENCE_LABELS,
  PAYMENT_RELIABILITY_LABELS,
  PIPELINE_STATUSES,
  PIPELINE_STATUS_LABELS,
  SHOP_TYPE_LABELS,
  type PaymentPreference,
  type PaymentReliability,
  type PipelineStatus,
  type ShopType,
} from '@metoo/shared'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { FilterTabs } from '@/components/console/filter-tabs'
import { PageHeader } from '@/components/dashboard-shell'
import { Pill } from '@/components/console/pill'
import { Card, CardEmpty } from '@/components/console/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/console/table'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import type { Applicant } from '@/lib/types'
import { PipelineStatusControl } from '../pipeline-status'

export const metadata: Metadata = { title: 'Retailers' }

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

const RELIABILITY_TONE: Record<
  PaymentReliability,
  'success' | 'warning' | 'danger'
> = {
  ON_TIME: 'success',
  PENDING: 'warning',
  LATE: 'danger',
}

export default async function AdminRetailersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: raw } = await searchParams
  const status = PIPELINE_STATUSES.includes(raw as PipelineStatus)
    ? (raw as PipelineStatus)
    : undefined

  const applicants = await api.get<Applicant[]>(
    `/admin/pipeline?role=RETAILER${status ? `&status=${status}` : ''}`
  )

  return (
    <>
      <PageHeader
        title="Retailers"
        description="Shop pipeline, capacity, and payment reliability."
      />

      <div>
        <FilterTabs
          items={[
            { href: '/admin/retailers', label: 'All', active: !status },
            ...PIPELINE_STATUSES.map((value) => ({
              href: `/admin/retailers?status=${value}`,
              label: PIPELINE_STATUS_LABELS[value],
              active: status === value,
            })),
          ]}
        />

        <Card>
          {applicants.length === 0 ? (
            <CardEmpty
              icon={Users}
              title="No retailers here"
              description="Shops appear as they sign up."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Shop</TH>
                  <TH>Location / zone</TH>
                  <TH>Type</TH>
                  <TH>Currently stocks</TH>
                  <TH className="text-right">Capacity</TH>
                  <TH>Payment</TH>
                  <TH>Delivery</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {applicants.map((applicant) => {
                  const shop = applicant.retailer
                  return (
                    <TR key={applicant.id}>
                      <TD>
                        <span className="font-bold">
                          {shop?.shopName ?? applicant.email}
                        </span>
                        <span className="block text-[13px] text-black/50">
                          {applicant.email}
                        </span>
                        <span className="block text-[13px] text-black/50">
                          Signed up {formatDate(applicant.createdAt)}
                        </span>
                      </TD>
                      <TD className="text-black/50">
                        {shop?.province ?? '—'}
                        {shop?.zone ? (
                          <span className="block text-[13px]">{shop.zone}</span>
                        ) : null}
                      </TD>
                      <TD className="text-black/50">
                        {shop?.shopType
                          ? SHOP_TYPE_LABELS[shop.shopType as ShopType]
                          : '—'}
                      </TD>
                      <TD className="max-w-[180px] text-black/50">
                        {shop?.currentProducts ?? '—'}
                      </TD>
                      <TD numeric>
                        {shop?.monthlyCapacity
                          ? `${shop.monthlyCapacity}/mo`
                          : '—'}
                      </TD>
                      <TD>
                        <span className="block text-[13px] text-black/50">
                          {shop?.preferredPayment
                            ? PAYMENT_PREFERENCE_LABELS[
                                shop.preferredPayment as PaymentPreference
                              ]
                            : '—'}
                        </span>
                        {shop ? (
                          <Pill
                            tone={
                              RELIABILITY_TONE[
                                shop.paymentReliability as PaymentReliability
                              ]
                            }
                          >
                            {
                              PAYMENT_RELIABILITY_LABELS[
                                shop.paymentReliability as PaymentReliability
                              ]
                            }
                          </Pill>
                        ) : null}
                      </TD>
                      <TD className="text-black/50">
                        {shop?.deliveryWindow ?? '—'}
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
