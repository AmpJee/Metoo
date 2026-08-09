import { describe, expect, it } from 'bun:test'
import { en, th, type MessageKey } from './dictionaries'

/**
 * What typecheck already guarantees, and what it cannot.
 *
 * Each dictionary module declares `th: Record<keyof typeof en, string>`, so a
 * key present in English and missing in Thai fails the build. That is the
 * strong guarantee and these tests do not repeat it.
 *
 * What the type system cannot see is a Thai *value* that was never translated
 * — an English string pasted into the `th` object to make the compiler stop
 * complaining. That is the failure mode this file exists to catch, and it is
 * the one that actually reaches a shopkeeper.
 */

/**
 * Strings that are deliberately identical in both languages.
 *
 * Product and company names, and terms Thai retailers genuinely say in
 * English. `lang.en`/`lang.th` are here because the toggle names each language
 * in its own script on purpose — translating them would defeat the control.
 */
const SAME_IN_BOTH = new Set<MessageKey>([
  'lang.en',
  'lang.th',
  'payment.PROMPTPAY',
  'adminSellers.fda',
  'adminHome.gmv',
  'adminOrders.gmv',
])

/** Substrings that make an otherwise-identical value legitimate. */
const PROPER_NOUNS = ['metoo', 'Metoo', 'PromptPay', 'GMV', 'SME', 'อย.']

const keys = Object.keys(en) as MessageKey[]

describe('dictionaries', () => {
  it('has at least one key', () => {
    expect(keys.length).toBeGreaterThan(0)
  })

  it('has a Thai value for every English key', () => {
    const missing = keys.filter((key) => !(key in th))
    expect(missing).toEqual([])
  })

  it('has no empty Thai values', () => {
    const empty = keys.filter((key) => th[key].trim() === '')
    expect(empty).toEqual([])
  })

  it('has no untranslated Thai values', () => {
    // An identical value is only suspicious when it contains Latin *prose*.
    // Placeholder names are Latin too, so they come out first — otherwise
    // "{n} × {price}", which is correctly the same in both languages, reads
    // as five untranslated letters.
    const prose = (value: string) => value.replaceAll(/\{\w+\}/g, '')

    const untranslated = keys.filter((key) => {
      if (SAME_IN_BOTH.has(key)) return false
      if (th[key] !== en[key]) return false
      if (!/[A-Za-z]{2}/.test(prose(en[key]))) return false
      return !PROPER_NOUNS.some((noun) => en[key].includes(noun))
    })
    expect(untranslated).toEqual([])
  })

  it('carries the same interpolation placeholders in both languages', () => {
    // A dropped {n} is a silently wrong sentence rather than a visible one:
    // `translate()` leaves an unknown placeholder in place but says nothing
    // about one the translation forgot.
    const placeholders = (value: string) =>
      [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()

    const mismatched = keys.filter((key) => {
      const left = placeholders(en[key])
      const right = placeholders(th[key])
      return left.join(',') !== right.join(',')
    })
    expect(mismatched).toEqual([])
  })

  it('has no leading or trailing whitespace', () => {
    // Call sites join these with their own spaces and separators; a stray one
    // in the data shows up as a double space nobody can find.
    const padded = keys.filter(
      (key) => en[key] !== en[key].trim() || th[key] !== th[key].trim()
    )
    expect(padded).toEqual([])
  })
})
