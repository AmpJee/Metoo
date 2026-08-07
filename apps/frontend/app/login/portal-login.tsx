import Link from 'next/link'
import { Suspense } from 'react'
import { AuthShell } from '@/components/auth-shell'
import type { Translate } from '@/lib/i18n'
import { getT } from '@/lib/i18n/server'
import { PORTALS, type PortalKey } from '@/lib/portals'
import { LoginForm } from './login-form'

/**
 * One sign-in page, rendered for whichever portal it is given.
 *
 * The three pages differ only in wording and which API route they post to, so
 * they share this rather than being three near-copies that drift apart the
 * first time one of them is restyled.
 */
export async function PortalLogin({ portal }: { portal: PortalKey }) {
  const t = await getT()

  return (
    <AuthShell
      title={t(
        `auth.${portal === 'seller' ? 'seller' : portal === 'admin' ? 'admin' : 'shop'}.title`
      )}
      subtitle={t(
        `auth.${portal === 'seller' ? 'seller' : portal === 'admin' ? 'admin' : 'shop'}.subtitle`
      )}
      footer={<PortalFooter portal={portal} t={t} />}
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
function PortalFooter({ portal, t }: { portal: PortalKey; t: Translate }) {
  if (portal === 'retailer') {
    return (
      <div className="flex flex-col gap-2 text-muted-foreground">
        <p>
          {t('auth.newHere')}{' '}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            {t('auth.signUpToBuy')}
          </Link>
        </p>
        <p>
          {t('auth.sellingHere')}{' '}
          <Link
            href={PORTALS.seller.loginPath}
            className="font-medium text-primary hover:underline"
          >
            {t('auth.sellerCentre')}
          </Link>
        </p>
      </div>
    )
  }

  if (portal === 'seller') {
    return (
      <div className="flex flex-col gap-2 text-muted-foreground">
        <p>
          {t('auth.newHere')}{' '}
          <Link
            href="/register/seller"
            className="font-medium text-primary hover:underline"
          >
            {t('auth.sellOnMetoo')}
          </Link>
        </p>
        <p>
          {t('auth.buyingInstead')}{' '}
          <Link
            href={PORTALS.retailer.loginPath}
            className="font-medium text-primary hover:underline"
          >
            {t('auth.shopSignIn')}
          </Link>
        </p>
      </div>
    )
  }

  // Admin: no signup, no cross-link worth advertising on a staff screen.
  return null
}
