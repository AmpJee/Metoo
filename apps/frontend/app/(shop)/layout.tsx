import { redirect } from 'next/navigation'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { ApiError, api } from '@/lib/api'
import { homeForRole } from '@/lib/roles'
import type { Cart, Me } from '@/lib/types'

/**
 * The gate for every buyer screen.
 *
 * proxy.ts already guarantees a session; what it cannot cheaply check is
 * approval, because that needs GET /auth/me. Doing it here costs nothing
 * extra — the header needs the same response for the shop name.
 *
 * Reading status from /auth/me rather than the token claim is deliberate: an
 * admin approving an account takes effect on the next navigation instead of
 * whenever the 15-minute access token happens to expire.
 */
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let me: Me
  try {
    me = await api.get<Me>('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect('/login')
    // An account still in the pipeline gets the screen that explains why,
    // not an error boundary.
    if (error instanceof ApiError && error.isNotOnboarded) redirect('/pending')
    throw error
  }

  // Only retailers shop. A brand or admin who lands here goes to their own
  // console rather than being told they are "pending" — they are not.
  if (me.role !== 'RETAILER') redirect(homeForRole(me.role))

  if (me.status !== 'ONBOARDED') redirect('/pending')

  // Failure here must not take the whole shell down — a badge showing zero is
  // better than an unusable site.
  const cartCount = await api
    .get<Cart>('/cart')
    .then((cart) => cart.itemCount)
    .catch(() => 0)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader me={me} cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
