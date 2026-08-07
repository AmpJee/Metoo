import { type SizeBand } from '@metoo/shared'
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/dashboard-shell'
import { Pill } from '@/components/console/pill'
import { ApiError, api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import type { Applicant, VerificationDocument } from '@/lib/types'
import { PipelineStatusControl } from '../../pipeline-status'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('applicant.title') }
}

/**
 * One brand applicant, with their verification documents.
 *
 * Approving a brand requires an ID (SME or national) **plus** an อย.
 * certificate, so both are listed with what is missing made obvious.
 */
export default async function SellerDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const t = await getT()
  const locale = await getLocale()
  const { userId } = await params

  const applicants = await api.get<Applicant[]>('/admin/pipeline?role=BRAND')
  const applicant = applicants.find((row) => row.id === userId)
  if (!applicant) notFound()

  // Documents are optional — a brand may not have uploaded any yet.
  let documents: VerificationDocument[] = []
  try {
    documents = await api.get<VerificationDocument[]>(
      `/admin/pipeline/${userId}/documents`
    )
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
  }

  const brand = applicant.brand
  const hasId = documents.some(
    (doc) => doc.type === 'SME_ID' || doc.type === 'NATIONAL_ID'
  )
  const hasFda = documents.some((doc) => doc.type === 'FDA_CERT')

  return (
    <>
      <PageHeader
        title={brand?.name ?? applicant.email}
        description={t('applicant.subtitle', {
          email: applicant.email,
          date: formatDate(applicant.createdAt, locale),
        })}
        actions={<Pill>{t(`pipeline.${applicant.status}`)}</Pill>}
      />

      <div>
        <Link
          href="/admin/sellers"
          className="mb-6 inline-flex items-center gap-1 text-[15px] text-black/50 hover:text-[#cb2957]"
        >
          <ArrowLeft className="size-4" /> {t('applicant.back')}
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-8">
            <section className="rounded-[9px] bg-white p-[24px]">
              <h2 className="mb-4 text-[16px] font-semibold">
                {t('applicant.verification')}
              </h2>

              <div className="mb-4 flex flex-wrap gap-2">
                <Pill tone={hasId ? 'success' : 'warning'}>
                  {hasId ? t('applicant.idProvided') : t('applicant.idMissing')}
                </Pill>
                <Pill tone={hasFda ? 'success' : 'warning'}>
                  {hasFda
                    ? t('applicant.fdaProvided')
                    : t('applicant.fdaMissing')}
                </Pill>
              </div>

              {documents.length === 0 ? (
                <p className="text-[15px] text-black/50">
                  {t('applicant.noDocuments')}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-black/10 px-3 py-2 text-[15px]"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="size-4 text-black/50" />
                        {t(`doc.${doc.type}`)}
                        <span className="text-[13px] text-black/50">
                          {formatDate(doc.createdAt, locale)}
                        </span>
                      </span>
                      {/* Signed URLs are short-lived and private. Linked, not
                          embedded — an <img> would cache a private document
                          and break once the signature expires. */}
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[#cb2957] hover:underline"
                      >
                        {t('applicant.openDocument')}{' '}
                        <ExternalLink className="size-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {brand ? (
              <section className="rounded-[9px] bg-white p-[24px]">
                <h2 className="mb-4 text-[16px] font-semibold">
                  {t('applicant.brandDetails')}
                </h2>
                <dl className="grid gap-x-6 gap-y-3 text-[15px] sm:grid-cols-2">
                  <Detail label={t('applicant.phone')} value={brand.phone} />
                  <Detail
                    label={t('applicant.province')}
                    value={brand.province}
                  />
                  <Detail
                    label={t('applicant.fdaStatus')}
                    value={t(`fda.${brand.fdaStatus}`)}
                  />
                  <Detail
                    label={t('applicant.teamSize')}
                    value={
                      brand.sizeBand
                        ? t(`sizeBand.${brand.sizeBand as SizeBand}`)
                        : null
                    }
                  />
                  <Detail
                    label={t('applicant.social')}
                    value={brand.socialHandle}
                  />
                  <Detail
                    label={t('applicant.existingRetailers')}
                    value={brand.existingRetailerCount?.toString() ?? null}
                  />
                  <Detail
                    label={t('applicant.caseSpec')}
                    value={
                      [
                        brand.caseWeightKg
                          ? t('applicant.caseWeight', { n: brand.caseWeightKg })
                          : null,
                        brand.caseDimensionsCm,
                        brand.caseUnits
                          ? t('applicant.caseUnits', { n: brand.caseUnits })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || null
                    }
                  />
                  <Detail
                    label={t('applicant.referral')}
                    value={brand.referralSource}
                  />
                  <Detail
                    label={t('applicant.productsListed')}
                    value={String(brand._count.products)}
                  />
                </dl>

                {brand.adminNotes ? (
                  <div className="mt-4 rounded-md bg-[#f5f5f5] p-3">
                    <p className="text-[13px] text-black/50">
                      {t('applicant.internalNotes')}
                    </p>
                    <p className="text-[15px]">{brand.adminNotes}</p>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-[9px] bg-white p-[24px]">
              <h2 className="mb-3 text-[16px] font-semibold">
                {t('applicant.pipelineStatus')}
              </h2>
              <PipelineStatusControl
                userId={applicant.id}
                current={applicant.status}
              />
              <p className="mt-3 text-[13px] text-black/50">
                {t('applicant.pipelineHint')}
              </p>
            </div>

            {applicant.reviewNote ? (
              <div className="rounded-[9px] bg-white p-[24px]">
                <h2 className="mb-2 text-[16px] font-semibold">
                  {t('applicant.noteToApplicant')}
                </h2>
                <p className="text-[15px] text-black/50">
                  {applicant.reviewNote}
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[13px] text-black/50">{label}</dt>
      <dd>{value ?? '—'}</dd>
    </div>
  )
}
