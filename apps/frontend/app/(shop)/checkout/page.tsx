import { MapPin, ShoppingCart, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { formatBaht } from '@/lib/format'
import { getT } from '@/lib/i18n/server'
import type { Cart, Me } from '@/lib/types'
import { CheckoutForm } from './checkout-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('checkout.title') }
}

export default async function CheckoutPage() {
  const t = await getT()
  const [cart, me] = await Promise.all([
    api.get<Cart>('/cart'),
    api.get<Me>('/auth/me'),
  ])

  // Nothing to check out — bounce rather than render a zero-total form.
  if (cart.itemCount === 0) {
    return (
      <div className="container-page py-8 md:py-12">
        <h1 className="text-[20px] font-bold md:text-[36px]">
          {t('checkout.title')}
        </h1>
        <div className="mt-8">
          <EmptyState
            icon={ShoppingCart}
            title={t('cart.emptyTitle')}
            description={t('checkout.emptyBody')}
            action={{ label: t('cart.startShopping'), href: '/explore' }}
          />
        </div>
      </div>
    )
  }

  // Any line whose product has been retired will fail re-validation at
  // checkout, so stop here with something the buyer can act on.
  const unavailable = cart.groups.flatMap((group) =>
    group.items.filter((item) => !item.product.isActive)
  )
  if (unavailable.length > 0) redirect('/cart')

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-[20px] font-bold md:text-[36px]">
        {t('checkout.title')}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">
              {t('checkout.deliveryAddress')}
            </h2>
            <div className="flex items-start gap-3 rounded-[9px] border border-border p-4">
              <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-mid" />
              <div className="text-sm">
                <p className="font-medium">{me.retailer?.shopName}</p>
                {/* TODO(api): the shop's address is not readable here.
                    GET /auth/me returns only { id, shopName } for the
                    retailer, and there is no retailer-facing profile route.
                    Needs GET/PATCH /retailer/profile before this can show or
                    edit the real address. The order snapshots it server-side
                    regardless, so delivery is unaffected. */}
                <p className="text-muted-foreground">
                  {t('checkout.addressNote')}
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">
              {t('checkout.productsOrdered')}
            </h2>
            {cart.groups.map((group) => (
              <div
                key={group.brand.id}
                className="rounded-[9px] border border-border"
              >
                <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium">
                  <Store className="size-4" />
                  {group.brand.name}
                </header>
                <ul className="divide-y divide-border">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between gap-4 px-4 py-3 text-sm"
                    >
                      <span>
                        {item.product.name}
                        <span className="text-muted-foreground">
                          {' '}
                          × {item.packs}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatBaht(item.lineTotalMinor)}
                      </span>
                    </li>
                  ))}
                </ul>
                <footer className="flex justify-between border-t border-border px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    {t('checkout.subtotal')}
                  </span>
                  <span className="font-medium">
                    {formatBaht(group.subtotalMinor)}
                  </span>
                </footer>
              </div>
            ))}
          </section>

          <CheckoutForm brandCount={cart.brandCount} />
        </div>

        <aside className="h-fit rounded-[9px] border border-border p-5 lg:sticky lg:top-[100px]">
          <h2 className="text-base font-semibold">
            {t('checkout.totalPayment')}
          </h2>

          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {t('checkout.merchandiseSubtotal')}
              </dt>
              <dd>{formatBaht(cart.subtotalMinor)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {t('checkout.shippingSubtotal')}
              </dt>
              <dd>
                {cart.shippingMinor === 0
                  ? t('cart.shippingFree')
                  : formatBaht(cart.shippingMinor)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold">
            <span>{t('checkout.orderTotal')}</span>
            <span className="text-primary">{formatBaht(cart.totalMinor)}</span>
          </div>

          {cart.brandCount > 1 ? (
            <p className="mt-3 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
              {t('checkout.splitNotice', { n: cart.brandCount })}
            </p>
          ) : null}

          <Link
            href="/cart"
            className="mt-4 block text-center text-sm text-muted-foreground hover:text-primary"
          >
            {t('checkout.backToCart')}
          </Link>
        </aside>
      </div>
    </div>
  )
}
