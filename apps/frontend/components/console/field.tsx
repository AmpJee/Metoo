import type * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Console form controls.
 *
 * The design's input is a filled grey box, not an outlined one:
 * `bg-[#f5f5f5] rounded-[8px] px-[16px] py-[12px] text-[16px]`, placeholder at
 * 40% black. Filled reads correctly on the white card it sits in.
 */

const CONTROL =
  'w-full rounded-[8px] bg-[#f5f5f5] px-[16px] py-[12px] text-[16px] text-black outline-none placeholder:text-black/40 disabled:opacity-50'

export function CInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />
}

export function CTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(CONTROL, 'min-h-[96px]', className)} {...props} />
  )
}

/**
 * Native select rather than a Radix listbox: keyboard- and screen-reader
 * correct for free, and it renders as the platform control on mobile — what
 * an operator filling in a pipeline field actually wants.
 */
export function CSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, className)} {...props} />
}

/** Label + control + optional hint, so console forms line up without repetition. */
export function CField({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('flex flex-col gap-[8px]', className)}>
      <span className="text-[16px] text-black">{label}</span>
      {children}
      {hint ? <span className="text-[14px] text-black/50">{hint}</span> : null}
    </label>
  )
}

/** The search box in the design: an icon and a borderless filled field. */
export function CSearch({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="flex min-w-[220px] flex-1 items-center gap-[8px] rounded-[9px] bg-[#f5f5f5] px-[14px] py-[10px]">
      {icon}
      <input
        className={cn(
          'w-full bg-transparent text-[16px] text-black outline-none placeholder:text-black/40',
          className
        )}
        {...props}
      />
    </div>
  )
}
