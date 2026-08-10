import { Mail } from 'lucide-react'
import type { Metadata } from 'next'
import {
  COMMISSION_BPS,
  FREE_SHIPPING_OVER_MINOR,
  OVER_TOP_BAND_PER_KG_MINOR,
  SHIPPING_BANDS,
  VOLUME_THRESHOLD,
} from '@metoo/shared'
import { SUPPORT_EMAIL } from '@/lib/support'
import { formatBaht } from '@/lib/format'
import { getT } from '@/lib/i18n/server'
import type { MessageKey, Translate } from '@/lib/i18n'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('help.metaTitle'), description: t('help.subtitle') }
}

/**
 * The help centre.
 *
 * Public, and deliberately so: the people who most need it are the ones who
 * cannot get in — a shop waiting on approval, a brand who signed up on the
 * wrong site, someone locked out of their password.
 *
 * Every number on this page is interpolated from the constant that decides it
 * rather than typed into the copy. A rate card change edits one table in
 * `packages/shared` and this page follows; it cannot quietly start lying about
 * what delivery costs.
 */
export default async function HelpPage() {
  const t = await getT()

  return (
    <div className="container-page py-8 md:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-[24px] font-bold md:text-[36px]">
          {t('help.title')}
        </h1>
        <p className="max-w-[60ch] text-muted-foreground">
          {t('help.subtitle')}
        </p>
      </header>

      <div className="mt-10 flex max-w-[820px] flex-col gap-10">
        <Section title={t('help.buying')}>
          <Faq q="help.q.startBuying" a="help.a.startBuying" t={t} />
          <Faq q="help.q.pending" a="help.a.pending" t={t} />
          <Faq q="help.q.minimum" a="help.a.minimum" t={t} />
          <Faq q="help.q.volume" a="help.a.volume" t={t} />
          <Faq q="help.q.split" a="help.a.split" t={t} />
          <Faq q="help.q.pay" a="help.a.pay" t={t} />
          <Faq q="help.q.slip" a="help.a.slip" t={t} />
          {/* The one answer with real numbers in it, so it is built from the
              shipping table rather than written out. */}
          <Faq
            q="help.q.delivery"
            a="help.a.delivery"
            t={t}
            vars={deliveryVars()}
          />
          <Faq q="help.q.stages" a="help.a.stages" t={t} />
          <Faq q="help.q.returns" a="help.a.returns" t={t} />
        </Section>

        <Section title={t('help.selling')}>
          <Faq q="help.q.sellerSite" a="help.a.sellerSite" t={t} />
          <Faq q="help.q.documents" a="help.a.documents" t={t} />
          <Faq
            q="help.q.commission"
            a="help.a.commission"
            t={t}
            vars={commissionVars()}
          />
          <Faq q="help.q.payout" a="help.a.payout" t={t} />
          <Faq q="help.q.shippingPayout" a="help.a.shippingPayout" t={t} />
        </Section>

        <Section title={t('help.account')}>
          <Faq q="help.q.twoSites" a="help.a.twoSites" t={t} />
          <Faq q="help.q.forgotPassword" a="help.a.forgotPassword" t={t} />
          <Faq q="help.q.language" a="help.a.language" t={t} />
        </Section>

        <section className="flex flex-col items-start gap-3 rounded-[9px] border border-border p-6">
          <h2 className="text-base font-semibold">{t('help.contactTitle')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('help.contactBody')}
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
          >
            <Mail className="size-4" />
            {SUPPORT_EMAIL}
          </a>
        </section>
      </div>
    </div>
  )
}

/** The delivery answer's numbers, straight from the band table. */
function deliveryVars(): Record<string, string> {
  const fee = (index: number) =>
    formatBaht(SHIPPING_BANDS[index]?.feeMinor ?? 0)

  return {
    b1: fee(0),
    b2: fee(1),
    b3: fee(2),
    b4: fee(3),
    b5: fee(4),
    perKg: formatBaht(OVER_TOP_BAND_PER_KG_MINOR),
    free: formatBaht(FREE_SHIPPING_OVER_MINOR),
  }
}

/** Both rates per category, written the way the seller screens write them. */
function commissionVars(): Record<string, string> {
  const pair = (category: keyof typeof COMMISSION_BPS) => {
    const [newBrand, highVolume] = COMMISSION_BPS[category]
    return `${newBrand / 100}% → ${highVolume / 100}%`
  }

  return {
    threshold: String(VOLUME_THRESHOLD),
    fb: pair('FOOD_BEVERAGE'),
    hb: pair('HEALTH_BEAUTY'),
    hl: pair('HOME_LIVING'),
    fa: pair('FASHION_ACCESSORIES'),
  }
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="mb-2 text-[18px] font-bold md:text-[22px]">{title}</h2>
      <div className="divide-y divide-border border-y border-border">
        {children}
      </div>
    </section>
  )
}

/**
 * One question, collapsed.
 *
 * `<details>` rather than a client component with state: a help page should
 * work before JavaScript arrives, and the browser already knows how to open
 * and close a disclosure. It is also what makes ⌘F find an answer inside a
 * closed question in most browsers.
 */
function Faq({
  q,
  a,
  t,
  vars,
}: {
  q: MessageKey
  a: MessageKey
  t: Translate
  vars?: Record<string, string>
}) {
  return (
    <details className="group py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
        {t(q)}
        <span className="shrink-0 text-primary transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
        {vars ? t(a, vars) : t(a)}
      </p>
    </details>
  )
}
