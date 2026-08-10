'use client'

import {
  Banknote,
  BarChart3,
  LayoutDashboard,
  MessageCircle,
  MessageSquare,
  Package,
  RotateCcw,
  Settings,
  ShoppingBag,
  Store,
  type LucideIcon,
  Users,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useT } from '@/components/i18n-provider'
import { LogoutButton } from '@/components/logout-button'
import type { MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * The console sidebar.
 *
 * A Client Component on purpose, and the reason is a real trap: a layout is
 * NOT re-rendered when you navigate between routes that share it — only the
 * page segment is. Deriving the active link from a request header read in the
 * layout therefore freezes it at whatever page was loaded first. `usePathname`
 * is the only thing that tracks navigation.
 *
 * The nav definitions live here rather than being passed in because Lucide
 * icons are components, and components cannot cross the server → client
 * boundary as props.
 */

type NavItem = { href: string; labelKey: MessageKey; icon: LucideIcon }

const NAV: Record<'seller' | 'admin', NavItem[]> = {
  seller: [
    {
      href: '/seller',
      labelKey: 'nav.seller.dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/seller/orders',
      labelKey: 'nav.seller.orders',
      icon: ShoppingBag,
    },
    {
      href: '/seller/chat',
      labelKey: 'nav.seller.chat',
      icon: MessageCircle,
    },
    {
      href: '/seller/products',
      labelKey: 'nav.seller.products',
      icon: Package,
    },
    { href: '/seller/wallet', labelKey: 'nav.seller.wallet', icon: Wallet },
    {
      href: '/seller/customers',
      labelKey: 'nav.seller.customers',
      icon: Users,
    },
    {
      href: '/seller/returns',
      labelKey: 'nav.seller.returns',
      icon: RotateCcw,
    },
    { href: '/seller/preview', labelKey: 'nav.seller.preview', icon: Store },
    {
      href: '/seller/settings',
      labelKey: 'nav.seller.settings',
      icon: Settings,
    },
  ],
  admin: [
    { href: '/admin', labelKey: 'nav.admin.summary', icon: BarChart3 },
    { href: '/admin/sellers', labelKey: 'nav.admin.sellers', icon: Store },
    { href: '/admin/retailers', labelKey: 'nav.admin.retailers', icon: Users },
    { href: '/admin/orders', labelKey: 'nav.admin.orders', icon: ShoppingBag },
    {
      href: '/admin/withdrawals',
      labelKey: 'nav.admin.withdrawals',
      icon: Banknote,
    },
    { href: '/admin/returns', labelKey: 'nav.admin.returns', icon: RotateCcw },
    {
      href: '/admin/feedback',
      labelKey: 'nav.admin.feedback',
      icon: MessageSquare,
    },
  ],
}

export function ConsoleNav({
  console: which,
}: {
  console: 'seller' | 'admin'
}) {
  const pathname = usePathname()
  const t = useT()
  const root = which === 'seller' ? '/seller' : '/admin'

  return (
    <nav className="flex gap-[6px] overflow-x-auto p-[16px] md:flex-col md:p-[20px]">
      {NAV[which].map((item) => {
        // The index link matches exactly; the rest also match their children,
        // so /seller/orders/123 still highlights Orders.
        const active =
          item.href === root
            ? pathname === root
            : pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-[14px] rounded-[9px] px-[18px] py-[14px] whitespace-nowrap transition-colors',
              active
                ? 'bg-[#cb2957] text-white'
                : 'text-black hover:bg-[#cb2957]/10'
            )}
          >
            <item.icon
              className={cn(
                'size-[22px] shrink-0',
                active ? 'text-white' : 'text-[#cb2957]'
              )}
              strokeWidth={1.75}
            />
            <span className="text-[18px]">{t(item.labelKey)}</span>
          </Link>
        )
      })}

      <LogoutButton
        variant="ghost"
        className="shrink-0 justify-start gap-[14px] rounded-[9px] px-[18px] py-[14px] text-[18px] font-normal text-black/60 hover:bg-black/5 md:mt-auto md:w-full"
      />
    </nav>
  )
}
