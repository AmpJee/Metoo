import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { ApiError, api } from '@/lib/api'
import { getT } from '@/lib/i18n/server'
import { homeForRole } from '@/lib/roles'
import type { Me } from '@/lib/types'
import { PORTALS } from '@/lib/portals'

/**
 * The gate for the management console.
 *
 * Role only — admins are seeded rather than approved, which is why every
 * /admin route on the API sets `roles` without `approved`. Checking ONBOARDED
 * here would lock the console against its own administrators.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getT()

  let me: Me
  try {
    me = await api.get<Me>('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized)
      redirect(PORTALS.admin.loginPath)
    throw error
  }

  if (me.role !== 'ADMIN') redirect(homeForRole(me.role))

  return (
    <DashboardShell
      title={t('console.admin')}
      console="admin"
      accountName={me.email}
      accountSubtitle={t('adminHome.internalAdmin')}
    >
      {children}
    </DashboardShell>
  )
}
