import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { ApiError, api } from '@/lib/api'
import { homeForRole } from '@/lib/roles'
import type { Me } from '@/lib/types'

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
  let me: Me
  try {
    me = await api.get<Me>('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect('/login')
    throw error
  }

  if (me.role !== 'ADMIN') redirect(homeForRole(me.role))

  return (
    <DashboardShell
      title="Management Console"
      console="admin"
      accountName={me.email}
      accountSubtitle="Internal admin"
    >
      {children}
    </DashboardShell>
  )
}
