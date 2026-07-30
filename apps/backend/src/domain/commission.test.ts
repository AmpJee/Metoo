import { describe, expect, test } from 'bun:test'
import {
  VOLUME_THRESHOLD,
  resolveCommissionBps,
  splitAmount,
} from './commission.ts'

describe('resolveCommissionBps', () => {
  test('a brand with no history pays the new-brand rate', () => {
    expect(resolveCommissionBps('FOOD_BEVERAGE', 0)).toBe(400)
    expect(resolveCommissionBps('HEALTH_BEAUTY', 0)).toBe(800)
    expect(resolveCommissionBps('HOME_LIVING', 0)).toBe(500)
    expect(resolveCommissionBps('FASHION_ACCESSORIES', 0)).toBe(600)
  })

  test('a high-volume brand pays the reduced rate', () => {
    expect(resolveCommissionBps('FOOD_BEVERAGE', 100)).toBe(200)
    expect(resolveCommissionBps('HEALTH_BEAUTY', 100)).toBe(500)
    expect(resolveCommissionBps('HOME_LIVING', 100)).toBe(300)
    expect(resolveCommissionBps('FASHION_ACCESSORIES', 100)).toBe(400)
  })

  test('the threshold is inclusive at exactly 30 orders', () => {
    // The boundary is the whole rule. 29 is still a new brand; 30 is not.
    expect(VOLUME_THRESHOLD).toBe(30)
    expect(resolveCommissionBps('FOOD_BEVERAGE', 29)).toBe(400)
    expect(resolveCommissionBps('FOOD_BEVERAGE', 30)).toBe(200)
    expect(resolveCommissionBps('FOOD_BEVERAGE', 31)).toBe(200)
  })

  test('every category has both tiers wired', () => {
    // Guards against a new category being added to the enum without a rate.
    for (const category of [
      'FOOD_BEVERAGE',
      'HEALTH_BEAUTY',
      'HOME_LIVING',
      'FASHION_ACCESSORIES',
    ] as const) {
      const low = resolveCommissionBps(category, 0)
      const high = resolveCommissionBps(category, VOLUME_THRESHOLD)
      // Volume must always be a discount, never a penalty.
      expect(high).toBeLessThan(low)
    }
  })
})

describe('splitAmount', () => {
  test('takes 4% of a round amount', () => {
    // ฿1000.00 at 4% = ฿40.00 commission, ฿960.00 payout
    expect(splitAmount(100_000, 400)).toEqual({
      commissionMinor: 4_000,
      payoutMinor: 96_000,
    })
  })

  test('commission plus payout always equals the subtotal', () => {
    // The invariant that matters: no satang may be created or destroyed.
    // Awkward amounts and rates are exactly where a naive two-multiplication
    // implementation loses one.
    const subtotals = [1, 7, 333, 1_001, 12_345, 99_999, 1_234_567]
    const rates = [200, 300, 400, 500, 800]

    for (const subtotal of subtotals) {
      for (const bps of rates) {
        const { commissionMinor, payoutMinor } = splitAmount(subtotal, bps)
        expect(commissionMinor + payoutMinor).toBe(subtotal)
      }
    }
  })

  test('rounds to whole satang', () => {
    // 333 * 4% = 13.32 satang, which must not survive as a fraction.
    const { commissionMinor, payoutMinor } = splitAmount(333, 400)
    expect(Number.isInteger(commissionMinor)).toBe(true)
    expect(Number.isInteger(payoutMinor)).toBe(true)
    expect(commissionMinor).toBe(13)
    expect(payoutMinor).toBe(320)
  })

  test('a tiny subtotal rounds commission to zero rather than going negative', () => {
    // 1 satang at 2% is 0.02, which rounds to 0. The brand keeps the satang;
    // the platform must never end up owed a negative payout.
    const { commissionMinor, payoutMinor } = splitAmount(1, 200)
    expect(commissionMinor).toBe(0)
    expect(payoutMinor).toBe(1)
  })

  test('a zero subtotal splits to zero', () => {
    expect(splitAmount(0, 800)).toEqual({
      commissionMinor: 0,
      payoutMinor: 0,
    })
  })

  test('the payout is never larger than the subtotal', () => {
    for (const bps of [200, 400, 800]) {
      const { payoutMinor } = splitAmount(50_000, bps)
      expect(payoutMinor).toBeLessThanOrEqual(50_000)
    }
  })
})
