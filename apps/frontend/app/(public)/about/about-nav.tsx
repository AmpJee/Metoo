'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/components/i18n-provider'
import type { MessageKey } from '@/lib/i18n'
import styles from './about.module.css'

const SECTIONS: { id: string; labelKey: MessageKey }[] = [
  { id: 'who', labelKey: 'story.navWho' },
  { id: 'story', labelKey: 'story.navStory' },
  { id: 'mission', labelKey: 'story.navMission' },
  { id: 'values', labelKey: 'story.navValues' },
]

/**
 * The team's pill nav, over the hero.
 *
 * A client component only because of the active pill: their version marked it
 * on click, which goes stale the moment someone scrolls instead. An observer
 * follows the section actually on screen, so the highlight is always telling
 * the truth about where you are.
 *
 * `rootMargin` pulls the trigger line down to a third from the top — without
 * it, a tall section counts as "in view" while its heading is still off
 * screen, and the highlight lands a section ahead of the reader.
 *
 * A click also sets the pill directly rather than waiting to be told. The
 * observer is the source of truth while scrolling, but it is not guaranteed
 * to run — it is throttled in some embedded and automation browsers — and a
 * nav whose highlight never moves when you press it looks broken in exactly
 * the case the user is most certain of the answer.
 */
export function AboutNav() {
  const t = useT()
  const [active, setActive] = useState('who')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-33% 0px -60% 0px' }
    )

    for (const { id } of SECTIONS) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.topBar}>
      {/* The team's design had their own wordmark here, because their page
          stood alone. Inside the site it sat directly under the header's, the
          same mark twice a few pixels apart. The header carries it now. */}
      <nav className={styles.pillNav} aria-label={t('story.navLabel')}>
        <ul className={styles.pillList}>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={() => setActive(section.id)}
                aria-current={active === section.id ? 'true' : undefined}
                className={`${styles.pill} ${
                  active === section.id ? styles.pillActive : ''
                }`}
              >
                {t(section.labelKey)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
