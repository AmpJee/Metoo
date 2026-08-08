import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { api } from '@/lib/api'
import type { Cart, Me } from '@/lib/types'

/**
 * The catalog shell — the one part of the shop that does not need an account.
 *
 * Browse, product detail and storefronts live here rather than in `(shop)`
 * because they are what a visitor sees first: a wholesale marketplace that
 * shows nothing until you have signed up and been approved has no way to earn
 * the signup. Everything that acts on a catalogue — cart, checkout, orders,
 * favourites — stays in `(shop)` behind the full gate.
 *
 * The session is resolved but never required. A signed-in retailer browsing
 * here gets their own header and cart badge; a visitor gets sign in / sign up.
 * Same pages either way, which is the point — a link someone shares works for
 * whoever opens it.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Any failure means "no shopper", including an expired session. Browsing
  // must not be the thing that shows someone an error page, and a lapsed
  // token here is indistinguishable from never having signed in.
  const me = await api.get<Me>('/auth/me').catch(() => null)

  // Only an onboarded retailer gets the signed-in chrome. A brand or admin
  // looking at the catalog has no cart and no saved list, so showing them
  // those links would be offering something that does not work.
  const shopper =
    me?.role === 'RETAILER' && me.status === 'ONBOARDED' ? me : null

  const cartCount = shopper
    ? await api
        .get<Cart>('/cart')
        .then((cart) => cart.itemCount)
        .catch(() => 0)
    : 0

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader me={shopper} cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
