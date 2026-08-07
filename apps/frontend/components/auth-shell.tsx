import Link from 'next/link'
import { LanguageToggle } from '@/components/language-toggle'

/** Shared frame for login, register and pending, so they read as one flow. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="container-page flex h-[44px] items-center md:h-[86px]">
          <Link
            href="/"
            className="text-[20px] font-bold text-primary md:text-[28px]"
          >
            metoo
          </Link>
          <LanguageToggle className="ml-auto" />
        </div>
      </header>

      <main className="container-page flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-[420px]">
          <h1 className="text-[24px] font-bold md:text-[32px]">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-sm">{footer}</div> : null}
        </div>
      </main>
    </div>
  )
}

/** Consistent label + field spacing across the auth forms. */
export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}
