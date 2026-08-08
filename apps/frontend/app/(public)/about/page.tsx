import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'
import type { MessageKey, Translate } from '@/lib/i18n'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('story.metaTitle'), description: t('story.heroBody') }
}

/**
 * About / Our Story.
 *
 * The copy and the structure are the team's own, from the standalone About
 * page they built; this is a port rather than a redesign. What changed is
 * everything around the words: it uses the site's palette, type scale and
 * container instead of its own stylesheet, so it reads as part of metoo and
 * not as a page that happens to share a logo. The pill nav and the GSAP
 * scroll animation are deliberately not carried over — this page sits inside
 * the site's own header, and a second navigation in the middle of it would
 * compete with the first.
 *
 * Public, and in `(public)/` for that reason: it is a page you send to someone
 * who has never heard of metoo.
 */
export default async function AboutPage() {
  const t = await getT()

  return (
    <div className="flex flex-col">
      <Hero t={t} />
      <WhoWeAre t={t} />
      <OurStory t={t} />
      <MissionVision t={t} />
      <Values t={t} />
      <CallToAction t={t} />
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-semibold tracking-[0.14em] text-primary uppercase">
      {children}
    </p>
  )
}

function Hero({ t }: { t: Translate }) {
  return (
    <section className="border-b border-border">
      <div className="container-page flex flex-col gap-5 py-16 md:py-24">
        <Eyebrow>{t('story.eyebrow')}</Eyebrow>
        <h1 className="max-w-[16ch] text-[32px] leading-[1.1] font-bold md:text-[64px]">
          {t('story.heroTitle')}
        </h1>
        <p className="max-w-[52ch] text-[16px] text-muted-foreground md:text-[20px]">
          {t('story.heroBody')}
        </p>
      </div>
    </section>
  )
}

function WhoWeAre({ t }: { t: Translate }) {
  return (
    <section id="who" className="bg-secondary/40">
      <div className="container-page grid gap-8 py-16 md:grid-cols-[220px_1fr] md:py-24">
        <Eyebrow>{t('story.whoEyebrow')}</Eyebrow>
        <div className="flex flex-col gap-5">
          <h2 className="max-w-[24ch] text-[24px] leading-tight font-bold md:text-[36px]">
            {t('story.whoTitle')}
          </h2>
          <p className="max-w-[62ch] text-muted-foreground">
            {t('story.whoBodyOne')}
          </p>
          <p className="max-w-[62ch] text-muted-foreground">
            {t('story.whoBodyTwo')}
          </p>
        </div>
      </div>
    </section>
  )
}

function OurStory({ t }: { t: Translate }) {
  return (
    <section id="story">
      <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[12px] bg-secondary">
          <Image
            src="/our-story.jpg"
            alt={t('story.photoAlt')}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col gap-5">
          <Eyebrow>{t('story.storyEyebrow')}</Eyebrow>
          <h2 className="max-w-[22ch] text-[24px] leading-tight font-bold md:text-[36px]">
            {t('story.storyTitle')}
          </h2>
          <p className="text-muted-foreground">{t('story.storyBodyOne')}</p>
          <p className="text-muted-foreground">{t('story.storyBodyTwo')}</p>
          <p className="text-muted-foreground">{t('story.storyBodyThree')}</p>
          <hr className="border-border" />
          <p className="text-[18px] font-semibold text-primary">
            {t('story.storyTagline')}
          </p>
        </div>
      </div>
    </section>
  )
}

function MissionVision({ t }: { t: Translate }) {
  return (
    <section id="mission" className="bg-secondary/40">
      <div className="container-page grid gap-6 py-16 md:grid-cols-2 md:py-24">
        {/* Two panels rather than two more headed blocks: mission and vision
            are a pair, and the design says so by weight rather than by a
            heading that repeats the word. */}
        <Panel
          tone="primary"
          eyebrow={t('story.missionEyebrow')}
          title={t('story.missionTitle')}
          body={t('story.missionBody')}
        />
        <Panel
          tone="dark"
          eyebrow={t('story.visionEyebrow')}
          title={t('story.visionTitle')}
          body={t('story.visionBody')}
        />
      </div>
    </section>
  )
}

function Panel({
  tone,
  eyebrow,
  title,
  body,
}: {
  tone: 'primary' | 'dark'
  eyebrow: string
  title: string
  body: string
}) {
  const primary = tone === 'primary'
  return (
    <div
      className={`flex flex-col gap-4 rounded-[12px] p-8 md:p-10 ${
        primary
          ? 'bg-primary text-primary-foreground'
          : 'bg-neutral-dark text-white'
      }`}
    >
      <p className="text-[13px] font-semibold tracking-[0.14em] uppercase opacity-80">
        {eyebrow}
      </p>
      <h3 className="text-[22px] leading-tight font-bold md:text-[28px]">
        {title}
      </h3>
      <p className="opacity-90">{body}</p>
    </div>
  )
}

const VALUES: { title: MessageKey; body: MessageKey }[] = [
  { title: 'story.value1Title', body: 'story.value1Body' },
  { title: 'story.value2Title', body: 'story.value2Body' },
  { title: 'story.value3Title', body: 'story.value3Body' },
  { title: 'story.value4Title', body: 'story.value4Body' },
  { title: 'story.value5Title', body: 'story.value5Body' },
]

function Values({ t }: { t: Translate }) {
  return (
    <section id="values">
      <div className="container-page flex flex-col gap-10 py-16 md:py-24">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <Eyebrow>{t('story.valuesEyebrow')}</Eyebrow>
            <h2 className="max-w-[20ch] text-[24px] leading-tight font-bold md:text-[36px]">
              {t('story.valuesTitle')}
            </h2>
          </div>
          <p className="max-w-[46ch] text-muted-foreground">
            {t('story.valuesBody')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((value, index) => (
            <div
              key={value.title}
              className="flex flex-col gap-2 rounded-[12px] border border-border p-6"
            >
              <span className="text-[13px] font-semibold text-primary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-[18px] font-semibold">{t(value.title)}</h3>
              <p className="text-sm text-muted-foreground">{t(value.body)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CallToAction({ t }: { t: Translate }) {
  return (
    <section id="why" className="border-t border-border bg-secondary/40">
      <div className="container-page flex flex-col items-center gap-6 py-16 text-center md:py-24">
        <Eyebrow>{t('story.ctaEyebrow')}</Eyebrow>
        <h2 className="max-w-[22ch] text-[26px] leading-tight font-bold md:text-[40px]">
          {t('story.ctaTitle')}
        </h2>
        <p className="max-w-[58ch] text-muted-foreground">
          {t('story.ctaBody')}
        </p>

        {/* Both sides of the marketplace sign up in different places, so both
            are offered by name — the seller link especially, since a brand
            landing on the shop's signup is the mistake this whole surface
            keeps having to correct. */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register/seller">{t('story.ctaSell')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/register">{t('story.ctaBuy')}</Link>
          </Button>
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t('story.ctaBrowse')} <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
