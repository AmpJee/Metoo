import { ChevronRight, Store } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatBaht, formatDate } from '@/lib/format'
import { statusLabel, statusTone } from '@/lib/order-status'
import type { Order } from '@/lib/types'

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-[9px] border border-border transition-colors hover:border-primary"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Store className="size-4" />
          {order.brand.name}
        </span>
        <Badge tone={statusTone(order.status)}>
          {statusLabel(order.status)}
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

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
        <span className="text-xs text-muted-foreground">
          {order.orderNumber} · {formatDate(order.createdAt)}
        </span>
        <span className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">Order Total:</span>
          <span className="font-semibold text-primary">
            {formatBaht(order.totalMinor)}
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </span>
      </footer>
    </Link>
  )
}
