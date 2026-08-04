import { describe, expect, test } from 'bun:test'
import { MAX_MESSAGE_LENGTH, checkMessage, isParticipant } from './chat.ts'

describe('checkMessage', () => {
  test('returns the trimmed body to store', () => {
    expect(checkMessage('  Do you have this in stock?  ')).toEqual({
      ok: true,
      body: 'Do you have this in stock?',
    })
  })

  test('rejects whitespace that would pass a minLength check', () => {
    // The failure this exists for: "   " is 3 characters, so `minLength: 1`
    // lets it through and it renders as a blank bubble.
    for (const blank of ['', ' ', '   ', '\n', '\t\t', '  \n  ']) {
      expect(checkMessage(blank)).toEqual({ ok: false, code: 'MESSAGE_EMPTY' })
    }
  })

  test('measures length after trimming, not before', () => {
    const atLimit = 'x'.repeat(MAX_MESSAGE_LENGTH)
    expect(checkMessage(`  ${atLimit}  `)).toEqual({ ok: true, body: atLimit })
    expect(checkMessage('x'.repeat(MAX_MESSAGE_LENGTH + 1))).toEqual({
      ok: false,
      code: 'MESSAGE_TOO_LONG',
    })
  })

  test('keeps newlines inside the message', () => {
    expect(checkMessage('Line one\nLine two')).toEqual({
      ok: true,
      body: 'Line one\nLine two',
    })
  })
})

describe('isParticipant', () => {
  const thread = { retailerId: 'ret-1', brandId: 'brand-1' }

  test('admits each side', () => {
    expect(isParticipant(thread, { retailerId: 'ret-1' })).toBe(true)
    expect(isParticipant(thread, { brandId: 'brand-1' })).toBe(true)
  })

  test('refuses an unrelated account', () => {
    expect(isParticipant(thread, { retailerId: 'ret-2' })).toBe(false)
    expect(isParticipant(thread, { brandId: 'brand-2' })).toBe(false)
  })

  test('refuses someone with neither profile, such as an admin', () => {
    expect(isParticipant(thread, {})).toBe(false)
    expect(isParticipant(thread, { retailerId: null, brandId: null })).toBe(
      false
    )
  })

  test('will not match a brand against the retailer slot', () => {
    // Both are UUIDs from different tables. A check that only asked "is this
    // id in the thread" would admit this; the side-specific one does not.
    expect(isParticipant(thread, { brandId: 'ret-1' })).toBe(false)
    expect(isParticipant(thread, { retailerId: 'brand-1' })).toBe(false)
  })
})
