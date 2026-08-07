import Link from 'next/link'
import { Suspense } from 'react'
import { AuthShell } from '@/components/auth-shell'
import { PORTALS, type PortalKey } from '@/lib/portals'
import { LoginForm } from './login-form'

/**
 * One sign-in page, rendered for whichever portal it is given.
 *
 * The three pages differ only in wording and which API route they post to, so
 * they share this rather than being three near-copies that drift apart the
 * first time one of them is restyled.
 */
export function PortalLogin({ portal }: { portal: PortalKey }) {
  const { title, subtitle } = PORTALS[portal]

  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
      footer={<PortalFooter portal={portal} />}
    >
      {/* useSearchParams needs a Suspense boundary to keep the page static. */}
      <Suspense fallback={null}>
        <LoginForm portal={portal} />
      </Suspense>
    </AuthShell>
  )
}

/**
 * Cross-links between the sites.
 *
 * Someone who lands on the wrong one should be able to leave without knowing
 * the URL. Both sides of the marketplace can sign themselves up; only admin
 * cannot, because staff accounts are seeded rather than applied for.
 */
function PortalFooter({ portal }: { portal: PortalKey }) {
  if (portal === 'retailer') {
    return (
      <div className="flex flex-col gap-2 text-muted-foreground">
        <p>
          New to Metoo?{' '}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Sign up to buy
          </Link>
        </p>
        <p>
          Selling on Metoo?{' '}
          <Link
            href={PORTALS.seller.loginPath}
            className="font-medium text-primary hover:underline"
          >
            Seller Centre
          </Link>
        </p>
      </div>
    )
  }

  if (portal === 'seller') {
    return (
      <div className="flex flex-col gap-2 text-muted-foreground">
        <p>
          New to Metoo?{' '}
          <Link
            href="/register/seller"
            className="font-medium text-primary hover:underline"
          >
            Sell on Metoo
          </Link>
        </p>
        <p>
          Buying instead?{' '}
          <Link
            href={PORTALS.retailer.loginPath}
            className="font-medium text-primary hover:underline"
          >
            Shop sign-in
          </Link>
        </p>
      </div>
    )
  }

  // Admin: no signup, no cross-link worth advertising on a staff screen.
  return null
}
