import { cn } from '@/lib/utils'

/**
 * Status pill, to the console design's spec:
 * `rounded-full px-[12px] py-[4px] text-[13px]`.
 *
 * Separate from `components/ui/badge.tsx` on purpose — that one belongs to the
 * buyer site, which has its own smaller square-ish badge. Sharing one
 * component would mean every console tweak risked changing the shop.
 */

const TONES = {
  neutral: 'bg-black/[0.06] text-black/70',
  primary: 'bg-[#cb2957]/10 text-[#cb2957]',
  success: 'bg-[#1f7a4d]/10 text-[#1f7a4d]',
  warning: 'bg-[#c47f00]/10 text-[#c47f00]',
  info: 'bg-[#7a4dcb]/10 text-[#7a4dcb]',
  danger: 'bg-[#d4183d]/10 text-[#d4183d]',
} as const

export type PillTone = keyof typeof TONES

export function Pill({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: PillTone
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-[12px] py-[4px] text-[13px] whitespace-nowrap',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
