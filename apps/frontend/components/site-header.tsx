import {
  Heart,
  History,
  Home,
  MessageCircle,
  Search,
  ShoppingCart,
  Store,
  User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { LanguageToggle } from '@/components/language-toggle'
import { LogoutButton } from '@/components/logout-button'
import { Button } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'
import type { Me } from '@/lib/types'

/**
 * The shop header.
 *
 * Heights follow the design: 44px on mobile, 86px from md up — the file
 * defines exactly those two widths and nothing between.
 *
 * `me` is null for a visitor browsing the public catalog. The nav then drops
 * to the two things that mean anything signed out — stores and the cart, the
 * cart because clicking it is how someone discovers they need an account —
 * and the account corner becomes sign in / sign up.
 */
export async function SiteHeader({
  me,
  cartCount,
}: {
  me: Me | null
  cartCount: number
}) {
  const t = await getT()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="container-page flex h-[44px] items-center gap-[14px] md:h-[86px] md:gap-x-[36px]">
        <Link href="/" className="shrink-0" aria-label="metoo">
          {/* The mark, not the word set in bold. Sized by height so it keeps
              the two heights the header design already uses. */}
          <Image
            src="/logo-wordmark.svg"
            alt=""
            width={124}
            height={30}
            className="h-[22px] w-auto md:h-[30px]"
            priority
          />
        </Link>

        {/* A minimum width the nav cannot eat into. Adding Chat made six
            items compete with the search box and squeezed it to a few
            characters — search is the primary way into a catalog, so it wins
            the space. */}
        {/* The wide layout starts at lg, not md. At 768 the search box, six
            nav icons, the language toggle, the shop name and Log out came to
            1050px and the whole page scrolled sideways — a tablet got the
            desktop row before there was room for it. */}
        <form
          action="/"
          className="relative hidden min-w-[200px] flex-1 lg:block"
        >
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            placeholder={t('nav.search')}
            className="h-10 w-full rounded-lg bg-input pr-3 pl-9 text-sm placeholder:text-muted-foreground"
          />
        </form>

        {/* The designer's nav. Home leads because the catalog is now the
            front page; Account moved into the corner beside Log out, where
            the shop name already lives. Chat, Saved and History
            are only for someone signed in — there is nothing behind them
            otherwise. */}
        <nav className="flex flex-1 items-center justify-end gap-[18px] md:flex-none md:gap-[26px]">
          <IconLink href="/" icon={Home} label={t('nav.home')} />
          <IconLink href="/stores" icon={Store} label={t('nav.stores')} />
          {me ? (
            <>
              <IconLink href="/saved" icon={Heart} label={t('nav.saved')} />
              <IconLink href="/orders" icon={History} label={t('nav.orders')} />
              <IconLink
                href="/chat"
                icon={MessageCircle}
                label={t('nav.chat')}
              />
            </>
          ) : null}
          <IconLink
            href="/cart"
            icon={ShoppingCart}
            label={t('nav.cart')}
            badge={cartCount}
          />
        </nav>

        <div className="hidden min-w-0 items-center gap-3 lg:flex">
          <LanguageToggle />
          {me ? (
            <>
              <Link
                href="/settings"
                className="max-w-[160px] truncate text-sm text-muted-foreground hover:text-primary"
              >
                {me.retailer?.shopName ?? me.email}
              </Link>
              <LogoutButton variant="outline" size="sm" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {t('nav.login')}
              </Link>
              <Button asChild size="sm">
                {/* /register, not /signup: there is no /signup route, and the
                    proxy treats an unknown path as private — the button sent
                    a visitor to the login page instead. */}
                <Link href="/register">{t('nav.signup')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search is in the nav row on desktop; on mobile it needs its own —
          and it shares that row with the things the desktop corner holds.
          Hiding that corner on small screens left a phone with no way to sign
          in, sign up, reach an account or change language at all. */}
      <div className="container-page flex items-center gap-2 pb-2 lg:hidden">
        <form action="/" className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            placeholder={t('nav.search')}
            className="h-9 w-full rounded-lg bg-input pr-3 pl-9 text-sm placeholder:text-muted-foreground"
          />
        </form>

        <LanguageToggle />

        {me ? (
          // The shop name does not fit beside a search box, so the account is
          // an icon here. Log out lives on the settings screen it opens.
          <Link
            href="/settings"
            aria-label={t('nav.account')}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-neutral-dark"
          >
            <User className="size-4" strokeWidth={1.5} />
          </Link>
        ) : (
          <Button asChild size="sm" className="shrink-0">
            <Link href="/login">{t('nav.login')}</Link>
          </Button>
        )}
      </div>
    </header>
  )
}

function IconLink({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string
  icon: typeof Heart
  label: string
  badge?: number
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex items-center gap-2 text-neutral-dark transition-colors hover:text-primary"
    >
      <Icon className="size-5" strokeWidth={1.5} />
      {/* Labels only where they fit. Thai runs longer than the designer's
          English, and turning them on at xl was exactly where the row stopped
          fitting — six labels plus the search box, the shop name and Log out
          came to more than 1280px. 2xl is the first width with room. */}
      <span className="hidden text-sm 2xl:inline">{label}</span>
      {badge ? (
        <span className="absolute -top-1.5 -left-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground md:-left-2.5">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  )
}
