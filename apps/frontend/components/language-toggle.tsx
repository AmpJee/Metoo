'use client'

import { Languages } from 'lucide-react'
import { useTransition } from 'react'
import { setLocale } from '@/app/actions/locale'
import { useLocale } from '@/components/i18n-provider'
import { LOCALES, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const SHORT: Record<Locale, string> = { th: 'ไทย', en: 'EN' }

/**
 * Switch between Thai and English.
 *
 * Two visible options rather than a dropdown: there are exactly two, and a
 * shopkeeper who cannot read the current language cannot read the label on a
 * closed menu either. Both are always shown in their own script, so the way
 * out is legible whichever one you are stuck in.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale()
  const [pending, startTransition] = useTransition()

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-full border border-border p-0.5',
        className
      )}
      role="group"
      aria-label="Language"
    >
      <Languages
        className="ml-1.5 size-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      {LOCALES.map((code) => {
        const active = code === locale
        return (
          <button
            key={code}
            type="button"
            disabled={pending || active}
            aria-pressed={active}
            onClick={() => startTransition(() => setLocale(code))}
            className={cn(
              'rounded-full px-2 py-1 text-xs font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
              pending && 'opacity-60'
            )}
          >
            {SHORT[code]}
          </button>
        )
      })}
    </div>
  )
}
