import {
  Heart,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Store,
} from 'lucide-react'
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
        <Link
          href="/explore"
          className="shrink-0 text-[20px] font-bold text-primary md:text-[28px]"
        >
          metoo
        </Link>

        <form action="/explore" className="relative hidden flex-1 md:block">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            placeholder={t('nav.search')}
            className="h-10 w-full rounded-lg bg-input pr-3 pl-9 text-sm placeholder:text-muted-foreground"
          />
        </form>

        <nav className="flex flex-1 items-center justify-end gap-[18px] md:flex-none md:gap-[26px]">
          <IconLink href="/stores" icon={Store} label={t('nav.stores')} />
          {me ? (
            <>
              <IconLink href="/saved" icon={Heart} label={t('nav.saved')} />
              <IconLink href="/orders" icon={Package} label={t('nav.orders')} />
            </>
          ) : null}
          <IconLink
            href="/cart"
            icon={ShoppingCart}
            label={t('nav.cart')}
            badge={cartCount}
          />
          {me ? (
            <IconLink
              href="/settings"
              icon={Settings}
              label={t('nav.account')}
            />
          ) : null}
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
      <form action="/explore" className="container-page pb-2 md:hidden">
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
      <span className="hidden text-sm md:inline">{label}</span>
      {badge ? (
        <span className="absolute -top-1.5 -left-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground md:-left-2.5">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  )
}
