import { ArrowRight, PackageCheck, Store, Truck } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { readTokens } from '@/lib/session'

/**
 * The logged-out landing page.
 *
 * This is the ONLY page reachable without a session: every buyer route on the
 * API requires an approved retailer, because wholesale prices are not public.
 * The copy is the designer's.
 */
export default async function LandingPage() {
  // Someone already signed in wants the catalog, not the sales pitch.
  const { accessToken, refreshToken } = await readTokens()
  if (accessToken || refreshToken) redirect('/explore')

  return <Landing />
}

function Landing() {
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
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Sign up to buy</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container-page py-16 md:py-28">
          <div className="mx-auto flex max-w-[685px] flex-col items-center gap-[26px] text-center">
            <h1 className="text-[28px] leading-tight font-bold md:text-[48px]">
              The best selection of brands for your store,{' '}
              <span className="text-primary">all in one place</span>
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Sign up to unlock wholesale pricing with over 5 brands. Order
              across multiple brands in one cart, track every delivery, and pay
              on your terms.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  Sign up to buy <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container-page pb-20">
          <div className="grid gap-[26px] md:grid-cols-3">
            {[
              {
                icon: Store,
                title: 'Browse local brands',
                body: 'Food & beverage, health & beauty, home & living and fashion — every brand vetted and อย.-checked before it can sell.',
              },
              {
                icon: PackageCheck,
                title: 'One cart, many brands',
                body: 'Fill a single cart across brands. At checkout it splits into one order per brand, so a delay at one never holds up another.',
              },
              {
                icon: Truck,
                title: 'Track every order',
                body: 'From confirmed through preparing, pickup and delivery — you always know where a shipment is.',
              },
            ].map(({ icon: Icon, title, body }) => (
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
            Are you a brand?{' '}
            <span className="text-foreground">Brand sign-up coming soon.</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
