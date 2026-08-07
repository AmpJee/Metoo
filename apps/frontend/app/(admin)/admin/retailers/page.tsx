import {
  PIPELINE_STATUSES,
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
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n/server'
import type { Applicant } from '@/lib/types'
import { PipelineStatusControl } from '../pipeline-status'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('adminRetailers.title') }
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

  const t = await getT()
  const locale = await getLocale()

  const applicants = await api.get<Applicant[]>(
    `/admin/pipeline?role=RETAILER${status ? `&status=${status}` : ''}`
  )

  return (
    <>
      <PageHeader
        title={t('adminRetailers.title')}
        description={t('adminRetailers.subtitle')}
      />

      <div>
        <FilterTabs
          items={[
            {
              href: '/admin/retailers',
              label: t('adminSellers.all'),
              active: !status,
            },
            ...PIPELINE_STATUSES.map((value) => ({
              href: `/admin/retailers?status=${value}`,
              label: t(`pipeline.${value}`),
              active: status === value,
            })),
          ]}
        />

        <Card>
          {applicants.length === 0 ? (
            <CardEmpty
              icon={Users}
              title={t('adminRetailers.emptyTitle')}
              description={t('adminRetailers.emptyBody')}
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t('adminRetailers.shop')}</TH>
                  <TH>{t('adminRetailers.zone')}</TH>
                  <TH>{t('adminRetailers.type')}</TH>
                  <TH>{t('adminRetailers.stocks')}</TH>
                  <TH className="text-right">{t('adminRetailers.capacity')}</TH>
                  <TH>{t('adminRetailers.payment')}</TH>
                  <TH>{t('adminRetailers.delivery')}</TH>
                  <TH>{t('adminSellers.status')}</TH>
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
                          {t('adminSellers.signedUp', {
                            date: formatDate(applicant.createdAt, locale),
                          })}
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
                          ? t(`shopType.${shop.shopType as ShopType}`)
                          : '—'}
                      </TD>
                      <TD className="max-w-[180px] text-black/50">
                        {shop?.currentProducts ?? '—'}
                      </TD>
                      <TD numeric>
                        {shop?.monthlyCapacity
                          ? t('adminRetailers.capacityValue', {
                              n: shop.monthlyCapacity,
                            })
                          : '—'}
                      </TD>
                      <TD>
                        <span className="block text-[13px] text-black/50">
                          {shop?.preferredPayment
                            ? t(
                                `payment.${shop.preferredPayment as PaymentPreference}`
                              )
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
                            {t(
                              `reliability.${shop.paymentReliability as PaymentReliability}`
                            )}
                          </Pill>
                        ) : null}
                      </TD>
                      <TD className="text-black/50">
                        {shop?.deliveryWindow ?? '—'}
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
