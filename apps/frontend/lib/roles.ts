import type { Me, Role } from './types'

/**
 * Where each role belongs after signing in.
 *
 * One place, because four callers need the same answer: the landing page, the
 * login form, and each console layout bouncing the wrong role away.
 */
export function homeForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'BRAND':
      return '/seller'
    case 'RETAILER':
      return '/explore'
  }
}

/**
 * Where this account should land, accounting for approval.
 *
 * Admins are seeded rather than approved, so they never see /pending — which
 * is also why the admin API routes check `roles` alone. Brands and retailers
 * must be ONBOARDED before their console is any use.
 */
export function homeForUser(me: Pick<Me, 'role' | 'status'>): string {
  if (me.role !== 'ADMIN' && me.status !== 'ONBOARDED') return '/pending'
  return homeForRole(me.role)
}
