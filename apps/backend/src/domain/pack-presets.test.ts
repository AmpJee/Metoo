import { describe, expect, test } from 'bun:test'
import { checkPackPresets } from './pack-presets.ts'

describe('checkPackPresets', () => {
  test('accepts the row the design shows', () => {
    expect(checkPackPresets([5, 10, 20, 30, 40], 5)).toEqual({ ok: true })
  })

  test('accepts none at all — presets are optional', () => {
    expect(checkPackPresets([], 12)).toEqual({ ok: true })
  })

  test('rejects a preset below the product minimum', () => {
    // The whole point: a 12-pack minimum makes a "5" button that always fails.
    expect(checkPackPresets([5, 10, 20], 12)).toMatchObject({
      ok: false,
      code: 'PRESETS_BELOW_MINIMUM',
      value: 5,
    })
  })

  test('the minimum itself is allowed', () => {
    expect(checkPackPresets([12, 24], 12)).toEqual({ ok: true })
  })

  test('rejects unsorted input rather than sorting it', () => {
    expect(checkPackPresets([10, 5, 20], 5)).toMatchObject({
      ok: false,
      code: 'PRESETS_NOT_ASCENDING',
      value: 5,
    })
  })

  test('rejects duplicates', () => {
    expect(checkPackPresets([10, 10], 5)).toMatchObject({
      ok: false,
      code: 'PRESETS_NOT_ASCENDING',
      value: 10,
    })
  })

  test('rejects more than the row can hold', () => {
    expect(checkPackPresets([1, 2, 3, 4, 5, 6, 7, 8, 9], 1)).toMatchObject({
      ok: false,
      code: 'PRESETS_TOO_MANY',
    })
    expect(checkPackPresets([1, 2, 3, 4, 5, 6, 7, 8], 1)).toEqual({ ok: true })
  })

  test('reports the minimum breach before the ordering one', () => {
    // [4, 2] breaks both rules; the more useful message names the minimum.
    expect(checkPackPresets([4, 2], 5)).toMatchObject({
      ok: false,
      code: 'PRESETS_BELOW_MINIMUM',
      value: 4,
    })
  })
})
