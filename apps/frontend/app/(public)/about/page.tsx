import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getT } from '@/lib/i18n/server'
import type { MessageKey, Translate } from '@/lib/i18n'
import styles from './about.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('story.metaTitle'), description: t('story.heroBody') }
}

/**
 * About / Our Story.
 *
 * The team's own page, kept as they designed it — see about.module.css for
 * what did and did not change. The structure here mirrors their HTML section
 * for section; the only real difference is that the copy comes from the
 * dictionary so the page reads in Thai as well as English, like every other
 * screen on the site.
 *
 * Public, and in `(public)/` for that reason: it is the page you send to
 * someone who has never heard of metoo.
 */
export default async function AboutPage() {
  const t = await getT()

  return (
    <div className={styles.page}>
      <Hero t={t} />
      <WhoWeAre t={t} />
      <OurStory t={t} />
      <MissionVision t={t} />
      <Values t={t} />
      <CallToAction t={t} />
    </div>
  )
}

function Hero({ t }: { t: Translate }) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.eyebrow}>{t('story.eyebrow')}</div>
        <h1>{t('story.heroTitle')}</h1>
        <p>{t('story.heroBody')}</p>
      </div>
    </section>
  )
}

function WhoWeAre({ t }: { t: Translate }) {
  return (
    <section id="who" className={`${styles.section} ${styles.cream}`}>
      <div className={styles.split}>
        <div className={styles.eyebrow}>{t('story.whoEyebrow')}</div>
        <div>
          <h2>{t('story.whoTitle')}</h2>
          <p>{t('story.whoBodyOne')}</p>
          <p>{t('story.whoBodyTwo')}</p>
        </div>
      </div>
    </section>
  )
}

function OurStory({ t }: { t: Translate }) {
  return (
    <section id="story" className={`${styles.section} ${styles.dark}`}>
      <div className={styles.story}>
        <div className={styles.storyImgWrap}>
          {/* width/height rather than fill: the pink offset frame is drawn on
              the wrapper, and a fill image needs a sized parent, which would
              mean giving the wrapper the aspect ratio the photo already has. */}
          <Image
            src="/our-story.jpg"
            alt={t('story.photoAlt')}
            width={880}
            height={1100}
            className={styles.storyImg}
            sizes="(max-width: 900px) 100vw, 40vw"
          />
        </div>

        <div className={styles.storyContent}>
          <div className={styles.eyebrow}>{t('story.storyEyebrow')}</div>
          <h2>{t('story.storyTitle')}</h2>
          <p>{t('story.storyBodyOne')}</p>
          <p>{t('story.storyBodyTwo')}</p>
          <p>{t('story.storyBodyThree')}</p>
          <hr className={styles.rule} />
          <div className={styles.tagline}>{t('story.storyTagline')}</div>
        </div>
      </div>
    </section>
  )
}

function MissionVision({ t }: { t: Translate }) {
  return (
    <section id="mission" className={styles.mvSection}>
      <div className={styles.mv}>
        <div className={styles.pinkPanel}>
          <div className={styles.eyebrow}>{t('story.missionEyebrow')}</div>
          <h3>{t('story.missionTitle')}</h3>
          <p>{t('story.missionBody')}</p>
        </div>
        <div className={styles.blackPanel}>
          <div className={styles.eyebrow}>{t('story.visionEyebrow')}</div>
          <h3>{t('story.visionTitle')}</h3>
          <p>{t('story.visionBody')}</p>
        </div>
      </div>
    </section>
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
    <section id="values" className={`${styles.section} ${styles.cream}`}>
      <div className={styles.valuesHead}>
        <div>
          <div className={styles.eyebrow}>{t('story.valuesEyebrow')}</div>
          <h2>{t('story.valuesTitle')}</h2>
        </div>
        <p>{t('story.valuesBody')}</p>
      </div>

      <div className={styles.valuesGrid}>
        {VALUES.map((value, index) => (
          <div key={value.title} className={styles.valueCard}>
            <span className={styles.num}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <h4>{t(value.title)}</h4>
            <p>{t(value.body)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CallToAction({ t }: { t: Translate }) {
  return (
    <section id="why" className={styles.ctaSection}>
      <div className={styles.eyebrow}>{t('story.ctaEyebrow')}</div>
      <h2>{t('story.ctaTitle')}</h2>
      <p>{t('story.ctaBody')}</p>

      {/* Their two buttons, pointed at the two real signups. Both sides by
          name — a brand landing on the shop's signup is the mistake this
          surface keeps having to correct. */}
      <div className={styles.ctaActions}>
        <Link href="/register/seller" className={styles.btn}>
          {t('story.ctaSell')}
        </Link>
        <Link href="/register" className={styles.btn}>
          {t('story.ctaBuy')}
        </Link>
      </div>

      <Link href="/explore" className={styles.btn}>
        {t('story.ctaBrowse')}
      </Link>
    </section>
  )
}
