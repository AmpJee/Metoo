import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Console buttons, to the design's spec.
 *
 * The design uses `rounded-[6px]` with generous horizontal padding and a
 * 16px label — noticeably chunkier than the buyer site's button, which is why
 * this is its own component rather than another variant on the shared one.
 */
const consoleButton = cva(
  'inline-flex items-center justify-center gap-[8px] rounded-[6px] text-[16px] whitespace-nowrap transition-opacity disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-[#cb2957] font-bold text-white hover:opacity-90',
        /** On a crimson surface — the Withdraw button inside the hero card. */
        onPrimary: 'bg-white font-bold text-[#cb2957] hover:opacity-90',
        secondary: 'border border-black/20 text-black hover:bg-black/[0.04]',
        ghost: 'text-black/70 hover:bg-black/[0.04]',
        danger:
          'border border-[#d4183d]/30 text-[#d4183d] hover:bg-[#d4183d]/[0.06]',
        success: 'text-[#1f7a4d] hover:bg-[#1f7a4d]/[0.08]',
      },
      size: {
        default: 'px-[28px] py-[12px]',
        sm: 'px-[16px] py-[8px] text-[15px]',
        wide: 'px-[32px] py-[12px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
)

export interface ConsoleButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof consoleButton> {
  asChild?: boolean
}

export function CButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ConsoleButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(consoleButton({ variant, size }), className)}
      {...props}
    />
  )
}
