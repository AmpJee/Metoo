import { ArrowRight, PackageCheck, Store, Truck } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LanguageToggle } from '@/components/language-toggle'
import { Button } from '@/components/ui/button'
import { ApiError, api } from '@/lib/api'
import { getT } from '@/lib/i18n/server'
import { homeForUser } from '@/lib/roles'
import { readTokens } from '@/lib/session'
import type { Me } from '@/lib/types'

/**
 * The sales pitch.
 *
 * It used to be `/`, back when it was the only page a visitor could reach.
 * Now the catalog is public and `/` goes there instead — showing someone the
 * goods beats telling them about the goods — so this is what the footer's
 * "About us" points at, and where a brand comes to sign up as a seller.
 *
 * The copy is the designer's.
 */
export default async function WelcomePage() {
  // Someone already signed in wants their own console, not the sales pitch.
  const { accessToken, refreshToken } = await readTokens()

  let destination: string | null = null
  if (accessToken || refreshToken) {
    try {
      destination = homeForUser(await api.get<Me>('/auth/me'))
    } catch (error) {
      // A dead session falls through to the public page rather than looping.
      if (!(error instanceof ApiError)) throw error
    }
  }

  // Outside the try on purpose: redirect() signals by throwing, and a catch
  // around it would swallow the redirect.
  if (destination) redirect(destination)

  return <Landing />
}

async function Landing() {
  const t = await getT()

  const features = [
    {
      icon: Store,
      title: t('landing.browseTitle'),
      body: t('landing.browseBody'),
    },
    {
      icon: PackageCheck,
      title: t('landing.cartTitle'),
      body: t('landing.cartBody'),
    },
    {
      icon: Truck,
      title: t('landing.trackTitle'),
      body: t('landing.trackBody'),
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="container-page flex h-[44px] items-center justify-between md:h-[86px]">
          <Link
            href="/"
            className="text-[20px] font-bold text-primary md:text-[28px]"
          >
            metoo
          </Link>
          <div className="flex items-center gap-3">
            {/* The one screen a signed-out shopkeeper always reaches, so it is
                also the only place they can switch language before signing
                in. Without it the toggle would live entirely behind auth. */}
            <LanguageToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">{t('auth.login')}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/register/seller">{t('landing.signUpAsBrand')}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">{t('landing.signUpToBuy')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container-page py-16 md:py-28">
          <div className="mx-auto flex max-w-[685px] flex-col items-center gap-[26px] text-center">
            <h1 className="text-[28px] leading-tight font-bold md:text-[48px]">
              {t('landing.heroLead')}{' '}
              <span className="text-primary">{t('landing.heroAccent')}</span>
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              {t('landing.heroBody')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  {t('landing.signUpToBuy')} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register/seller">
                  {t('landing.signUpAsBrand')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/login">{t('landing.haveAccount')}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container-page pb-20">
          <div className="grid gap-[26px] md:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col gap-2 rounded-[9px] border border-border p-6"
              >
                <Icon className="size-6 text-primary" strokeWidth={1.5} />
                <h2 className="text-base font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Metoo</p>
          <p>
            {t('landing.areYouBrand')}{' '}
            <Link
              href="/register/seller"
              className="font-medium text-primary hover:underline"
            >
              {t('landing.signUpAsBrand')}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
