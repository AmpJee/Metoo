import { ChevronRight, Store } from 'lucide-react'
import Link from 'next/link'
import { ConfirmDeliveredButton } from '@/components/confirm-delivered-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatBaht, formatDate } from '@/lib/format'
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
export function OrderCard({ order }: { order: Order }) {
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
            {buyerStatusLabel(order.status)}
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
                +{order.items.length - 3} more
              </li>
            ) : null}
          </ul>
        </div>
      </Link>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <span className="text-xs text-muted-foreground">
          {order.orderNumber} · {formatDate(order.createdAt)}
        </span>

        <span className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground">Order Total:</span>
            <span className="font-semibold text-primary">
              {formatBaht(order.totalMinor)}
            </span>
          </span>

          {toPay ? (
            <Button asChild size="sm">
              <Link href={`/orders/${order.id}/pay`}>Pay</Link>
            </Button>
          ) : toConfirm ? (
            <ConfirmDeliveredButton orderId={order.id} className="w-[190px]" />
          ) : (
            <Link
              href={`/orders/${order.id}`}
              aria-label="Open order"
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
