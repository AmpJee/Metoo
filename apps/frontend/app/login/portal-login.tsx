import { ArrowRight, Store } from 'lucide-react'
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
      <div className="flex flex-col gap-4 text-muted-foreground">
        <p>
          {t('auth.newHere')}{' '}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            {t('auth.signUpToBuy')}
          </Link>
        </p>

        {/* A block rather than one more line of muted text. This is the shop's
            sign-in, and a brand arriving here has correct credentials that
            will be refused — the seller entrance has to be visible before
            they start typing, because nobody reads a footnote first. */}
        <SellerDoor t={t} />
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

/**
 * The way in to Seller Centre, made obvious.
 *
 * Brands and retailers sign in on separate sites deliberately, so the only
 * way that split does not become a trap is for the other door to be visible
 * from this one.
 */
function SellerDoor({ t }: { t: Translate }) {
  return (
    <Link
      href={PORTALS.seller.loginPath}
      className="flex items-center gap-3 rounded-[9px] border border-border p-4 transition-colors hover:border-primary"
    >
      <Store className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
      <span className="flex flex-1 flex-col">
        <span className="text-sm font-medium text-foreground">
          {t('auth.sellingHere')}
        </span>
        <span className="text-xs">{t('auth.sellerDoorHint')}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-primary" />
    </Link>
  )
}
