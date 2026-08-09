import Link from 'next/link'
import { ConsoleNav } from '@/components/console/console-nav'

/**
 * Console frame, shared by the seller and admin dashboards.
 *
 * Built to the designer's `SellerShell.tsx` / `AdminShell.tsx`, which are the
 * same structure: a grey page, a full-width white top bar carrying the brand
 * and the account, then a 260px white sidebar beside the content column.
 *
 * The pixel values here are the design's own, not the Tailwind scale — same
 * approach as the buyer site, and the reason it matched.
 *
 * This stays a Server Component; only the nav inside it is client-side,
 * because the active link has to follow navigation. See ConsoleNav.
 */
export function DashboardShell({
  title,
  console: which,
  accountName,
  accountSubtitle,
  children,
}: {
  title: string
  console: 'seller' | 'admin'
  accountName: string
  accountSubtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f5f5f5]">
      <header className="w-full bg-white px-[16px] py-[12px] md:px-[32px] md:py-[16px]">
        <div className="flex items-center gap-[16px] md:gap-[32px]">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-[16px] pr-0 md:gap-[32px] md:pr-[20px]"
          >
            <span className="size-[48px] shrink-0 rounded-[8px] bg-[#cb2957] md:size-[86px]" />
            <span className="text-[24px] font-bold whitespace-nowrap text-black md:text-[36px]">
              metoo
            </span>
          </Link>

          <span className="hidden h-[56px] w-px shrink-0 bg-[#cb2957] md:block" />

          <p className="hidden text-[24px] whitespace-nowrap text-[#cb2957] md:block md:text-[36px]">
            {title}
          </p>

          {/* `min-w-fit` here refused to shrink below the account name, which
              pushed the console 14px wider than a 375px phone on every screen.
              The name truncates instead — a shop knows its own name, and a
              page that scrolls sideways is worse than an ellipsis. */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-[14px]">
            <div className="flex min-w-0 flex-col items-end">
              <p className="max-w-full truncate text-[18px] font-bold text-black md:max-w-[200px] md:text-[20px]">
                {accountName}
              </p>
              <p className="truncate text-[14px] text-black/50">
                {accountSubtitle}
              </p>
            </div>
            {/* The design's avatar is a plain crimson circle with an initial —
                no account images exist anywhere in the schema. */}
            <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-[#cb2957] text-[18px] font-bold text-white md:size-[60px] md:text-[20px]">
              {accountName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <div className="flex w-full flex-1 flex-col md:flex-row">
        <aside className="w-full shrink-0 bg-white md:min-h-full md:w-[260px] md:border-r md:border-black/10">
          <ConsoleNav console={which} />
        </aside>

        <main className="flex w-full min-w-0 flex-1 flex-col gap-[20px] px-[16px] pt-[24px] pb-[32px] md:px-[32px]">
          {children}
        </main>
      </div>
    </div>
  )
}

/**
 * Screen heading inside the content column.
 *
 * The console name lives in the top bar, so this is the screen's own title —
 * smaller, and carrying any per-screen actions such as the period toggle.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-[16px]">
      <div>
        <h1 className="text-[24px] font-bold text-black md:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[15px] text-black/50">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-[12px]">{actions}</div>
      ) : null}
    </div>
  )
}
