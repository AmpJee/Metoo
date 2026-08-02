import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'
import { LogoutButton } from '@/components/logout-button'
import { ApiError, api } from '@/lib/api'
import type { Me, PipelineStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Account under review' }

/**
 * Where a signed-in but not-yet-ONBOARDED retailer lands.
 *
 * This screen is not optional: registration creates an account at
 * NOT_CONTACTED, and every buyer route requires ONBOARDED. Without it a new
 * signup would face a redirect loop or a blank page.
 */
const COPY: Record<
  PipelineStatus,
  { icon: typeof Clock; tone: string; title: string; body: string }
> = {
  NOT_CONTACTED: {
    icon: Clock,
    tone: 'text-warning',
    title: 'Your account is under review',
    body: 'Thanks for signing up. Our team reviews every shop before opening wholesale pricing — we will be in touch shortly.',
  },
  CONTACTED: {
    icon: Clock,
    tone: 'text-warning',
    title: 'We have been in touch',
    body: 'Someone from our team has reached out. Once we have finished going through your details, your account will be opened.',
  },
  INTERESTED: {
    icon: CheckCircle2,
    tone: 'text-info',
    title: 'Almost there',
    body: 'Your shop is being set up. You will be able to browse the catalog as soon as onboarding is complete.',
  },
  ONBOARDED: {
    icon: CheckCircle2,
    tone: 'text-success',
    title: 'You are approved',
    body: 'Your account is active.',
  },
  DECLINED: {
    icon: XCircle,
    tone: 'text-destructive',
    title: 'We could not approve this account',
    body: 'Unfortunately we are unable to open wholesale access for this shop at the moment.',
  },
}

export default async function PendingPage() {
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

  const { icon: Icon, tone, title, body } = COPY[me.status]

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
              Status: {me.status.replaceAll('_', ' ').toLowerCase()}
            </p>
          </div>
        </div>

        {/* reviewNote is the admin's message to the applicant — the whole
            point of it is that being blocked is actionable, not mysterious. */}
        {me.reviewNote ? (
          <div className="rounded-[9px] bg-secondary p-4 text-sm">
            <p className="mb-1 font-medium">A note from our team</p>
            <p className="text-muted-foreground">{me.reviewNote}</p>
          </div>
        ) : null}

        <LogoutButton variant="outline" />
      </div>
    </AuthShell>
  )
}
