import { Store } from 'lucide-react'
import { ShoppingCart } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { formatBaht } from '@/lib/format'
import { getT } from '@/lib/i18n/server'
import type { Cart, RetailerProfile } from '@/lib/types'
import { CartLine } from './cart-line'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('cart.title') }
}

export default async function CartPage() {
  const t = await getT()
  const cart = await api.get<Cart>('/cart')

  // Checked here as well as at checkout. The API refuses an incomplete shop
  // profile either way, but finding that out on the last screen — after
  // choosing a payment method — is a worse place to learn it than on the
  // cart, where there is nothing to lose by leaving.
  const profile = await api
    .get<RetailerProfile>('/retailer/profile')
    .catch(() => null)
  const missing = profile?.missingForCheckout ?? []

  if (cart.itemCount === 0) {
    return (
      <div className="container-page py-8 md:py-12">
        <h1 className="text-[20px] font-bold text-primary md:text-[36px]">
          {t('cart.title')}
        </h1>
        <div className="mt-8">
          <EmptyState
            icon={ShoppingCart}
            title={t('cart.emptyTitle')}
            description={t('cart.emptyBody')}
            action={{ label: t('cart.startShopping'), href: '/explore' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-[20px] font-bold text-primary md:text-[36px]">
        {t('cart.title')}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          {/* One card per brand. This grouping is not cosmetic: checkout
              creates one order per brand, so the cart shows the split the
              buyer will actually get. */}
          {cart.groups.map((group) => (
            <section
              key={group.brand.id}
              className="rounded-[9px] border border-border"
            >
              <header className="flex items-center justify-between border-b border-border px-4 py-3">
                <Link
                  href={`/stores/${group.brand.id}`}
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                >
                  <Store className="size-4" />
                  {group.brand.name}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {formatBaht(group.subtotalMinor)}
                </span>
              </header>

              <div className="divide-y divide-border px-4">
                {group.items.map((item) => (
                  <CartLine key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="h-fit rounded-[9px] border border-border p-5 lg:sticky lg:top-[100px]">
          <h2 className="text-base font-semibold">{t('cart.summary')}</h2>

          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {t(
                  cart.itemCount === 1
                    ? 'cart.subtotalItem'
                    : 'cart.subtotalItems',
                  { n: cart.itemCount }
                )}
              </dt>
              <dd>{formatBaht(cart.subtotalMinor)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('cart.shipping')}</dt>
              {/* A real number, priced by the same rule checkout will use.
                  Payment is one bank transfer against this total, so it has
                  to be final here. */}
              <dd>
                {cart.shippingMinor === 0
                  ? t('cart.shippingFree')
                  : formatBaht(cart.shippingMinor)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold">
            <span>{t('cart.total')}</span>
            <span className="text-primary">{formatBaht(cart.totalMinor)}</span>
          </div>

          {/* The one number that changes what someone puts in a basket. Shown
              per brand because the threshold is per brand — a parcel is one
              brand's goods. */}
          {cart.groups
            .filter((group) => group.toFreeShippingMinor > 0)
            .map((group) => (
              <p
                key={group.brand.id}
                className="mt-3 rounded-md bg-secondary p-3 text-xs text-muted-foreground"
              >
                {t('cart.toFreeShipping', {
                  brand: group.brand.name,
                  amount: formatBaht(group.toFreeShippingMinor),
                })}
              </p>
            ))}

          {cart.brandCount > 1 ? (
            <p className="mt-3 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
              {t('cart.splitNotice', { n: cart.brandCount })}
            </p>
          ) : null}

          {missing.length > 0 ? (
            <div className="mt-4 flex flex-col gap-2 rounded-md bg-secondary p-3">
              <p className="text-xs text-muted-foreground">
                {/* The field labels come from the API, which still names them
                    in English. See the note on server errors in the plan. */}
                {t('cart.profileNeeded', {
                  fields: missing.map((m) => m.label).join(', '),
                })}
              </p>
              <Button asChild size="lg" className="w-full">
                <Link href="/settings#shop">{t('cart.completeProfile')}</Link>
              </Button>
            </div>
          ) : (
            <Button asChild size="lg" className="mt-4 w-full">
              <Link href="/checkout">{t('cart.checkout')}</Link>
            </Button>
          )}

          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href="/explore">{t('cart.continue')}</Link>
          </Button>
        </aside>
      </div>
    </div>
  )
}
