import { ChevronRight, Store } from 'lucide-react'
import Link from 'next/link'
import { ConfirmDeliveredButton } from '@/components/confirm-delivered-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatBaht, formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import {
  awaitingBuyerConfirmation,
  awaitingPayment,
  buyerStatusLabel,
  statusTone,
} from '@/lib/order-status'
import type { Order } from '@/lib/types'

/**
 * One order in My Purchase.
 *
 * The card is not a single link: an order still awaiting payment carries a Pay
 * button, and a link cannot be nested inside another link. The header and body
 * are the link; the footer holds the actions.
 */
export async function OrderCard({ order }: { order: Order }) {
  const t = await getT()
  const locale = await getLocale()
  const toPay = awaitingPayment(order.status)
  const toConfirm = awaitingBuyerConfirmation(order.status)

  return (
    <div className="rounded-[9px] border border-border transition-colors hover:border-primary">
      <Link href={`/orders/${order.id}`} className="block">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Store className="size-4" />
            {order.brand.name}
          </span>
          <Badge tone={statusTone(order.status)}>
            {buyerStatusLabel(order.status, t)}
          </Badge>
        </header>

        <div className="px-4 py-3">
          <ul className="flex flex-col gap-1 text-sm">
            {order.items.slice(0, 3).map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span className="truncate">
                  {item.productName}
                  <span className="text-muted-foreground"> × {item.packs}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatBaht(item.lineTotalMinor)}
                </span>
              </li>
            ))}
            {order.items.length > 3 ? (
              <li className="text-xs text-muted-foreground">
                {t('orders.more', { n: order.items.length - 3 })}
              </li>
            ) : null}
          </ul>
        </div>
      </Link>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <span className="text-xs text-muted-foreground">
          {order.orderNumber} · {formatDate(order.createdAt, locale)}
        </span>

        <span className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground">
              {t('orders.orderTotal')}:
            </span>
            <span className="font-semibold text-primary">
              {formatBaht(order.totalMinor)}
            </span>
          </span>

          {toPay ? (
            <Button asChild size="sm">
              <Link href={`/orders/${order.id}/pay`}>{t('orders.pay')}</Link>
            </Button>
          ) : toConfirm ? (
            // No fixed width: "ยืนยันรับสินค้า" and "Confirm Delivered" are
            // different lengths, and a 190px box clipped one of them.
            <ConfirmDeliveredButton orderId={order.id} />
          ) : (
            <Link
              href={`/orders/${order.id}`}
              aria-label={t('orders.open')}
              className="text-muted-foreground hover:text-primary"
            >
              <ChevronRight className="size-4" />
            </Link>
          )}
        </span>
      </footer>
    </div>
  )
}
