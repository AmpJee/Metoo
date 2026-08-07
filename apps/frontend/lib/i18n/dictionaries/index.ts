/**
 * UI copy, in both languages.
 *
 * Keyed rather than translating English strings at runtime: two screens can
 * legitimately show the same English word and need different Thai, and a key
 * survives a copy edit that a string lookup would not.
 *
 * `en` is the source of truth for what keys exist — each module declares
 * `th: Record<keyof typeof en, string>`, so adding an English string without a
 * Thai one fails the build in the file that owns it rather than somewhere in
 * this merge. Error locality is the whole reason the dictionary is split.
 *
 * Thai is the market language. Where a term is genuinely used in English by
 * Thai retailers (PromptPay, อย., SME) it stays as it is spoken, not translated
 * into something nobody says out loud.
 */

import * as auth from './auth'
import * as consoles from './console'
import * as enums from './enums'
import * as shell from './shell'
import * as shop from './shop'

export const en = {
  ...shell.en,
  ...auth.en,
  ...shop.en,
  ...consoles.en,
  ...enums.en,
}

export type Dict = typeof en
export type MessageKey = keyof Dict

export const th: Record<MessageKey, string> = {
  ...shell.th,
  ...auth.th,
  ...shop.th,
  ...consoles.th,
  ...enums.th,
}

export const DICTIONARIES = { en, th } as const
