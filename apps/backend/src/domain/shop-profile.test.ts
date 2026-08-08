import { describe, expect, test } from 'bun:test'
import type { ShopProfile } from './shop-profile.ts'
import {
  REQUIRED_SHOP_FIELDS,
  missingShopFields,
  shopProfileComplete,
} from './shop-profile.ts'

const complete: ShopProfile = {
  shopType: 'MINIMART',
  zone: 'Sukhumvit',
  currentProducts: 'Snacks, drinks, household',
  monthlyCapacity: 40,
  preferredPayment: 'PROMPTPAY',
  deliveryWindow: 'Weekday mornings',
}

describe('shopProfileComplete', () => {
  test('a fully answered profile may trade', () => {
    expect(shopProfileComplete(complete)).toBe(true)
    expect(missingShopFields(complete)).toEqual([])
  })

  test('a brand-new profile is missing everything', () => {
    const empty: ShopProfile = {
      shopType: null,
      zone: null,
      currentProducts: null,
      monthlyCapacity: null,
      preferredPayment: null,
      deliveryWindow: null,
    }
    expect(shopProfileComplete(empty)).toBe(false)
    expect(missingShopFields(empty)).toHaveLength(REQUIRED_SHOP_FIELDS.length)
  })

  test('a payment preference is not required', () => {
    // Only PromptPay is offered, so there is nothing to prefer. Blocking
    // checkout on it made a shop answer a question with one option.
    const noPreference: ShopProfile = { ...complete, preferredPayment: null }
    expect(shopProfileComplete(noPreference)).toBe(true)
    expect(missingShopFields(noPreference)).toEqual([])
  })

  test('each required field on its own blocks checkout', () => {
    for (const [field] of REQUIRED_SHOP_FIELDS) {
      const profile = { ...complete, [field]: null }
      expect(shopProfileComplete(profile)).toBe(false)
      expect(missingShopFields(profile).map((m) => m.field)).toEqual([field])
    }
  })
})

describe('what counts as missing', () => {
  test('a cleared text field is missing, not merely empty', () => {
    // A column that was set and then cleared holds "" rather than null. A
    // blank zone is no more deliverable than one that was never answered.
    expect(shopProfileComplete({ ...complete, zone: '' })).toBe(false)
    expect(shopProfileComplete({ ...complete, zone: '   ' })).toBe(false)
  })

  test('zero or negative capacity is not a usable answer', () => {
    expect(shopProfileComplete({ ...complete, monthlyCapacity: 0 })).toBe(false)
    expect(shopProfileComplete({ ...complete, monthlyCapacity: -5 })).toBe(
      false
    )
    expect(shopProfileComplete({ ...complete, monthlyCapacity: 1 })).toBe(true)
  })
})

describe('the missing list', () => {
  test('names fields so the caller can tell the shop what to fill in', () => {
    const missing = missingShopFields({
      ...complete,
      zone: null,
      deliveryWindow: null,
    })
    expect(missing.map((m) => m.label)).toEqual([
      'Location or zone',
      'Delivery window',
    ])
  })

  test('reports them in form order, not the order they were checked', () => {
    const missing = missingShopFields({
      ...complete,
      deliveryWindow: null,
      shopType: null,
    })
    expect(missing.map((m) => m.field)).toEqual(['shopType', 'deliveryWindow'])
  })

  test('paymentReliability is not required of the shop', () => {
    // It is a track record an admin maintains, not something a shop declares.
    expect(REQUIRED_SHOP_FIELDS.map(([f]) => f)).not.toContain(
      'paymentReliability' as never
    )
  })
})
