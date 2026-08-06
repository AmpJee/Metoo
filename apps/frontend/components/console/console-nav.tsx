'use client'

import {
  Banknote,
  BarChart3,
  LayoutDashboard,
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
import { LogoutButton } from '@/components/logout-button'
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

type NavItem = { href: string; label: string; icon: LucideIcon }

const NAV: Record<'seller' | 'admin', NavItem[]> = {
  seller: [
    { href: '/seller', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/seller/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/seller/products', label: 'Products', icon: Package },
    { href: '/seller/wallet', label: 'Wallet', icon: Wallet },
    { href: '/seller/customers', label: 'Customers', icon: Users },
    { href: '/seller/returns', label: 'Returns', icon: RotateCcw },
    { href: '/seller/preview', label: 'Preview Store', icon: Store },
    { href: '/seller/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { href: '/admin', label: 'Weekly Summary', icon: BarChart3 },
    { href: '/admin/sellers', label: 'Sellers', icon: Store },
    { href: '/admin/retailers', label: 'Retailers', icon: Users },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/withdrawals', label: 'Withdrawals', icon: Banknote },
    { href: '/admin/returns', label: 'Returns', icon: RotateCcw },
    { href: '/admin/feedback', label: 'Feedback Log', icon: MessageSquare },
  ],
}

export function ConsoleNav({
  console: which,
}: {
  console: 'seller' | 'admin'
}) {
  const pathname = usePathname()
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
            <span className="text-[18px]">{item.label}</span>
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
