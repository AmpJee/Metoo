import type * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Console table, to the design's spec:
 *
 *   header row  border-b border-black/10
 *   body row    border-b border-black/[0.06], hover bg-[#cb2957]/[0.03]
 *   cell        px-[12px] py-[14px] align-top text-[15px]
 *
 * The table sits inside a white card rather than a bordered box — the card is
 * the container, so the table itself draws no outer border.
 */

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    // Wide console tables scroll inside their own card instead of making the
    // page scroll sideways.
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full', className)} {...props} />
    </div>
  )
}

export function THead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('border-b border-black/10', className)} {...props} />
  )
}

export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-black/[0.06] transition-colors last:border-0 hover:bg-[#cb2957]/[0.03]',
        className
      )}
      {...props}
    />
  )
}

export function TH({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-[12px] py-[12px] text-left text-[14px] font-normal whitespace-nowrap text-black/50',
        className
      )}
      {...props}
    />
  )
}

export function TD({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        'px-[12px] py-[14px] align-top text-[15px] text-black',
        // tabular-nums only in columns, where digits must line up.
        numeric && 'text-right tabular-nums',
        className
      )}
      {...props}
    />
  )
}

/** Secondary line inside a cell — the grey detail under a name. */
export function TSub({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('block text-[13px] text-black/50', className)}
      {...props}
    />
  )
}
