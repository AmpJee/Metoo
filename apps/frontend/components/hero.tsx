'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES } from '@metoo/shared'
import { useT } from '@/components/i18n-provider'

const TYPE_MS = 70
const DELETE_MS = 40
const HOLD_MS = 1400

/**
 * One word at a time, typed then deleted, looping.
 *
 * Restarts cleanly when the word list changes, which is what happens the
 * moment someone switches language — without that the Thai word would be
 * typed on top of however much of the English one was still on screen.
 */
function useTypedWord(words: readonly string[]) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setText('')
    setDeleting(false)
    setIndex(0)
  }, [words])

  useEffect(() => {
    const word = words[index % words.length] ?? ''

    if (!deleting && text === word) {
      const hold = setTimeout(() => setDeleting(true), HOLD_MS)
      return () => clearTimeout(hold)
    }

    if (deleting && text === '') {
      setDeleting(false)
      setIndex((i) => (i + 1) % words.length)
      return
    }

    const tick = setTimeout(
      () =>
        setText(
          deleting
            ? word.slice(0, text.length - 1)
            : word.slice(0, text.length + 1)
        ),
      deleting ? DELETE_MS : TYPE_MS
    )
    return () => clearTimeout(tick)
  }, [text, deleting, index, words])

  return text
}

/**
 * The marketplace hero — the designer's, cycling a category through the
 * headline.
 *
 * It sits above the product grid rather than on a page of its own: someone
 * following a shared link should see the pitch and the goods in one screen,
 * which is the whole argument for a public catalog.
 *
 * `brandCount` is the real number of brands with something for sale, not a
 * round number typed into a design. It is the one claim on this page a
 * visitor could check, so it has to be true.
 */
export function Hero({ brandCount }: { brandCount: number }) {
  const t = useT()

  const words = useMemo(
    () => [
      t('hero.bestSeller'),
      ...CATEGORIES.map((category) => t(`category.${category}`)),
    ],
    [t]
  )
  const typed = useTypedWord(words)

  return (
    <section className="flex w-full flex-col items-center justify-center gap-5 rounded-[9px] bg-background px-6 py-16 text-center md:py-[120px]">
      <h1 className="max-w-[900px] text-[32px] leading-[1.1] font-bold md:text-[64px]">
        {t('hero.find')}{' '}
        <span className="text-primary">
          {typed}
          {/* The caret is its own element so it keeps blinking while the word
              is held, rather than only while characters are being added. */}
          <span className="ml-[2px] inline-block h-[0.85em] w-[3px] animate-pulse bg-primary align-[-0.08em] md:w-[5px]" />
        </span>
      </h1>

      <p className="max-w-[620px] text-[15px] text-muted-foreground md:text-[22px]">
        {t('hero.subtitle')}
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/register"
          className="rounded-[9px] bg-primary px-6 py-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 md:px-8 md:py-[18px]"
        >
          {t('hero.signUpToBuy')}
        </Link>
        <Link
          href="/register/seller"
          className="rounded-[9px] border border-border px-6 py-[14px] font-medium transition-colors hover:border-primary md:px-8 md:py-[18px]"
        >
          {t('hero.signUpToSell')}
        </Link>
      </div>

      {brandCount > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('hero.trusted', { n: brandCount })}
        </p>
      ) : null}
    </section>
  )
}
