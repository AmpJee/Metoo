import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'
import { LogoutButton } from '@/components/logout-button'
import { ApiError, api } from '@/lib/api'
import { getT } from '@/lib/i18n/server'
import type { Me, PipelineStatus } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('pending.title') }
}

/**
 * Where a signed-in but not-yet-ONBOARDED retailer lands.
 *
 * This screen is not optional: registration creates an account at
 * NOT_CONTACTED, and every buyer route requires ONBOARDED. Without it a new
 * signup would face a redirect loop or a blank page.
 *
 * Only the icon and tone live here now — the wording is keyed by pipeline
 * status in the dictionary (`pending.NOT_CONTACTED.title` and friends).
 */
const PRESENTATION: Record<
  PipelineStatus,
  { icon: typeof Clock; tone: string }
> = {
  NOT_CONTACTED: { icon: Clock, tone: 'text-warning' },
  CONTACTED: { icon: Clock, tone: 'text-warning' },
  INTERESTED: { icon: CheckCircle2, tone: 'text-info' },
  ONBOARDED: { icon: CheckCircle2, tone: 'text-success' },
  DECLINED: { icon: XCircle, tone: 'text-destructive' },
}

export default async function PendingPage() {
  const t = await getT()

  let me: Me
  try {
    me = await api.get<Me>('/auth/me')
  } catch (error) {
    // No usable session — proxy.ts normally catches this first.
    if (error instanceof ApiError && error.isUnauthorized) redirect('/login')
    throw error
  }

  // Approved users have no business here.
  if (me.status === 'ONBOARDED') redirect('/explore')

  const { icon: Icon, tone } = PRESENTATION[me.status]
  const title = t(`pending.${me.status}.title`)
  const body = t(`pending.${me.status}.body`)

  return (
    <AuthShell title={title} subtitle={body}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-3 rounded-[9px] border border-border p-4">
          <Icon
            className={`mt-0.5 size-5 shrink-0 ${tone}`}
            strokeWidth={1.5}
          />
          <div className="text-sm">
            <p className="font-medium">{me.retailer?.shopName ?? me.email}</p>
            <p className="text-muted-foreground">
              {/* The pipeline label rather than a lowercased enum name: it is
                  already translated, and "not contacted" was never wording
                  anyone chose. */}
              {t('pending.status')}: {t(`pipeline.${me.status}`)}
            </p>
          </div>
        </div>

        {/* reviewNote is the admin's message to the applicant — the whole
            point of it is that being blocked is actionable, not mysterious. */}
        {me.reviewNote ? (
          <div className="rounded-[9px] bg-secondary p-4 text-sm">
            <p className="mb-1 font-medium">{t('pending.noteTitle')}</p>
            <p className="text-muted-foreground">{me.reviewNote}</p>
          </div>
        ) : null}

        <LogoutButton variant="outline" />
      </div>
    </AuthShell>
  )
}
