import { CATEGORIES } from '@metoo/shared'
import Link from 'next/link'
import { getT } from '@/lib/i18n/server'
import { cn } from '@/lib/utils'

/** Category pills. "All" clears the filter rather than selecting a value. */
export async function CategoryNav({
  active,
  q,
}: {
  active?: string
  q?: string
}) {
  const t = await getT()

  const href = (category?: string) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (q) params.set('q', q)
    const query = params.toString()
    return query ? `/explore?${query}` : '/explore'
  }

  return (
    <nav className="flex flex-wrap gap-[10px]">
      <Pill href={href()} active={!active}>
        {t('explore.all')}
      </Pill>
      {CATEGORIES.map((category) => (
        <Pill key={category} href={href(category)} active={active === category}>
          {t(`category.${category}`)}
        </Pill>
      ))}
    </nav>
  )
}

function Pill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-neutral-line text-neutral-dark hover:border-primary hover:text-primary'
      )}
    >
      {children}
    </Link>
  )
}
