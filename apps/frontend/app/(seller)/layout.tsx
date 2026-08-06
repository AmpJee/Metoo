import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { ApiError, api } from '@/lib/api'
import { homeForRole } from '@/lib/roles'
import type { Me } from '@/lib/types'
import { PORTALS } from '@/lib/portals'

/**
 * The gate for the seller console: an ONBOARDED brand.
 *
 * A brand that is not yet onboarded goes to /pending, same as a retailer —
 * `requireAccess({ roles: ['BRAND'], approved: true })` on every /brand route
 * would reject it anyway, and a wall of 403s explains nothing.
 */
export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let me: Me
  try {
    me = await api.get<Me>('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized)
      redirect(PORTALS.seller.loginPath)
    throw error
  }

  if (me.role !== 'BRAND') redirect(homeForRole(me.role))
  if (me.status !== 'ONBOARDED') redirect('/pending')

  return (
    <DashboardShell
      title="Seller"
      console="seller"
      accountName={me.brand?.name ?? me.email}
      accountSubtitle={me.email}
    >
      {children}
    </DashboardShell>
  )
}
