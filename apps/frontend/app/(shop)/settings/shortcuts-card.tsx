import { Package, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { AccountCard } from '@/components/account/card'
import { LogoutButton } from '@/components/logout-button'
import { getT } from '@/lib/i18n/server'

/**
 * The designer's shortcuts row.
 *
 * Only destinations that exist. The design also lists "Order history" beside
 * "My purchases"; here they are the same screen — /orders shows every order
 * with tabs — so listing both would be two doors into one room.
 */
export async function ShortcutsCard() {
  const t = await getT()

  return (
    <AccountCard title={t('settings.shortcuts')}>
      <div className="flex flex-wrap gap-4">
        <Shortcut
          href="/orders"
          icon={Package}
          label={t('settings.myPurchases')}
        />
        <Shortcut
          href="/returns"
          icon={RotateCcw}
          label={t('settings.myReturns')}
        />
        <LogoutButton
          variant="outline"
          className="h-auto gap-2.5 rounded-[9px] border-primary px-5 py-3 text-[16px] font-normal text-primary hover:bg-primary/10"
        />
      </div>
    </AccountCard>
  )
}

function Shortcut({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: typeof Package
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-[9px] border border-black/20 px-5 py-3 transition-colors hover:bg-black/5"
    >
      <Icon className="size-[18px] shrink-0 text-primary" />
      <span className="text-[16px] whitespace-nowrap text-black">{label}</span>
    </Link>
  )
}
