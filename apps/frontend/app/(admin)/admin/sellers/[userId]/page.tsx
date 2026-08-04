import {
  FDA_STATUS_LABELS,
  PIPELINE_STATUS_LABELS,
  SIZE_BAND_LABELS,
  type SizeBand,
} from '@metoo/shared'
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/dashboard-shell'
import { Pill } from '@/components/console/pill'
import { ApiError, api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import type { Applicant, VerificationDocument } from '@/lib/types'
import { PipelineStatusControl } from '../../pipeline-status'

export const metadata: Metadata = { title: 'Seller' }

const DOC_LABELS: Record<VerificationDocument['type'], string> = {
  SME_ID: 'SME registration',
  NATIONAL_ID: 'National ID',
  FDA_CERT: 'อย. certificate',
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
        description={`${applicant.email} · signed up ${formatDate(applicant.createdAt)}`}
        actions={<Pill>{PIPELINE_STATUS_LABELS[applicant.status]}</Pill>}
      />

      <div>
        <Link
          href="/admin/sellers"
          className="mb-6 inline-flex items-center gap-1 text-[15px] text-black/50 hover:text-[#cb2957]"
        >
          <ArrowLeft className="size-4" /> Sellers
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-8">
            <section className="rounded-[9px] bg-white p-[24px]">
              <h2 className="mb-4 text-[16px] font-semibold">Verification</h2>

              <div className="mb-4 flex flex-wrap gap-2">
                <Pill tone={hasId ? 'success' : 'warning'}>
                  {hasId ? 'ID provided' : 'ID missing'}
                </Pill>
                <Pill tone={hasFda ? 'success' : 'warning'}>
                  {hasFda ? 'อย. provided' : 'อย. missing'}
                </Pill>
              </div>

              {documents.length === 0 ? (
                <p className="text-[15px] text-black/50">
                  Nothing uploaded yet. A brand needs an SME or national ID and
                  an อย. certificate before it can be onboarded.
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
                        {DOC_LABELS[doc.type]}
                        <span className="text-[13px] text-black/50">
                          {formatDate(doc.createdAt)}
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
                        Open <ExternalLink className="size-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {brand ? (
              <section className="rounded-[9px] bg-white p-[24px]">
                <h2 className="mb-4 text-[16px] font-semibold">
                  Brand details
                </h2>
                <dl className="grid gap-x-6 gap-y-3 text-[15px] sm:grid-cols-2">
                  <Detail label="Phone" value={brand.phone} />
                  <Detail label="Province" value={brand.province} />
                  <Detail
                    label="อย. status"
                    value={FDA_STATUS_LABELS[brand.fdaStatus]}
                  />
                  <Detail
                    label="Team size"
                    value={
                      brand.sizeBand
                        ? SIZE_BAND_LABELS[brand.sizeBand as SizeBand]
                        : null
                    }
                  />
                  <Detail label="Social" value={brand.socialHandle} />
                  <Detail
                    label="Existing retailers"
                    value={brand.existingRetailerCount?.toString() ?? null}
                  />
                  <Detail
                    label="Case spec"
                    value={
                      [
                        brand.caseWeightKg ? `${brand.caseWeightKg} kg` : null,
                        brand.caseDimensionsCm,
                        brand.caseUnits ? `${brand.caseUnits} units` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || null
                    }
                  />
                  <Detail label="Referral" value={brand.referralSource} />
                  <Detail
                    label="Products listed"
                    value={String(brand._count.products)}
                  />
                </dl>

                {brand.adminNotes ? (
                  <div className="mt-4 rounded-md bg-[#f5f5f5] p-3">
                    <p className="text-[13px] text-black/50">
                      Internal notes — not shown to the applicant
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
                Pipeline status
              </h2>
              <PipelineStatusControl
                userId={applicant.id}
                current={applicant.status}
              />
              <p className="mt-3 text-[13px] text-black/50">
                Onboarded is the gate — until then every trading route refuses
                this account.
              </p>
            </div>

            {applicant.reviewNote ? (
              <div className="rounded-[9px] bg-white p-[24px]">
                <h2 className="mb-2 text-[16px] font-semibold">
                  Note to applicant
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
