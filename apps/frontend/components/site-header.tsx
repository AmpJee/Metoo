import {
  Heart,
  History,
  Home,
  MessageCircle,
  Search,
  ShoppingCart,
  Store,
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
        <form
          action="/"
          className="relative hidden min-w-[200px] flex-1 md:block"
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

        <div className="hidden items-center gap-3 md:flex">
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
                <Link href="/signup">{t('nav.signup')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search is in the nav row on desktop; on mobile it needs its own. */}
      <form action="/" className="container-page pb-2 md:hidden">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            placeholder={t('nav.search')}
            className="h-9 w-full rounded-lg bg-input pr-3 pl-9 text-sm placeholder:text-muted-foreground"
          />
        </div>
      </form>
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
          English — "ประวัติการสั่งซื้อ" against "History" — so the row is
          icon-only until there is room for words. */}
      <span className="hidden text-sm xl:inline">{label}</span>
      {badge ? (
        <span className="absolute -top-1.5 -left-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground md:-left-2.5">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  )
}
