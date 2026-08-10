import { describe, expect, test } from 'bun:test'
import type { DeliveryAddressFields, ShopAddress } from './delivery-address.ts'
import {
  formatShippingAddress,
  hasDeliveryAddress,
  resolveShippingAddress,
} from './delivery-address.ts'

/**
 * Both fixtures are invented, and have to stay that way — a test file is
 * committed, shared and read by everyone who works here, so a real name,
 * phone or address does not belong in one.
 *
 * The two addresses are deliberately in different districts with different
 * postcodes. Half the assertions below are about the delivery address winning
 * over the shop's, and identical values would let a bug that returns the
 * wrong one pass.
 */
const shop: ShopAddress = {
  shopName: 'Somchai Minimart',
  phone: '021111111',
  addressLine: '99/1 Phahonyothin Road',
  // Null on purpose: this fixture is a shop that registered before the area
  // picker existed, which is what the fallback tests below are about — the
  // formatter must not leave blank gaps where แขวง and เขต would go.
  subdistrict: null,
  district: null,
  province: 'Bangkok',
  postalCode: '10400',
}

const noDelivery: DeliveryAddressFields = {
  deliveryRecipient: null,
  deliveryPhone: null,
  deliveryAddressLine: null,
  deliverySubdistrict: null,
  deliveryDistrict: null,
  deliveryProvince: null,
  deliveryPostalCode: null,
}

const delivery: DeliveryAddressFields = {
  deliveryRecipient: 'สมหญิง ใจดี',
  deliveryPhone: '0812345678',
  deliveryAddressLine: 'อาคารตัวอย่าง เลขที่ 1 ห้อง 101',
  deliverySubdistrict: 'ห้วยขวาง',
  deliveryDistrict: 'ห้วยขวาง',
  deliveryProvince: 'กรุงเทพมหานคร',
  deliveryPostalCode: '10310',
}

describe('hasDeliveryAddress', () => {
  test('needs the four parts a courier cannot do without', () => {
    expect(hasDeliveryAddress(delivery)).toBe(true)
    expect(hasDeliveryAddress(noDelivery)).toBe(false)
  })

  test('a missing district is not a deliverable address', () => {
    expect(hasDeliveryAddress({ ...delivery, deliveryDistrict: null })).toBe(
      false
    )
  })

  test('whitespace is not an address', () => {
    // A form that submits empty strings must not read as filled in.
    expect(hasDeliveryAddress({ ...delivery, deliveryPostalCode: '   ' })).toBe(
      false
    )
  })

  test('no recipient or phone is still deliverable', () => {
    // Both fall back to the shop's own. Refusing to ship over a missing name
    // would be a worse answer than posting it to the shop.
    expect(
      hasDeliveryAddress({
        ...delivery,
        deliveryRecipient: null,
        deliveryPhone: null,
      })
    ).toBe(true)
  })
})

describe('resolveShippingAddress', () => {
  test('prefers the delivery address', () => {
    const resolved = resolveShippingAddress({ ...shop, ...delivery })
    expect(resolved.recipient).toBe('สมหญิง ใจดี')
    expect(resolved.phone).toBe('0812345678')
    expect(resolved.district).toBe('ห้วยขวาง')
    // The delivery postcode, not the shop's 10400.
    expect(resolved.postalCode).toBe('10310')
    expect(resolved.usedShopAddress).toBe(false)
  })

  test('falls back to the shop address, and says so', () => {
    // A retailer who signed up before the delivery section existed must still
    // be able to order — and an operator chasing a lost parcel needs to know
    // the address was inherited rather than chosen.
    const resolved = resolveShippingAddress({ ...shop, ...noDelivery })
    expect(resolved.recipient).toBe('Somchai Minimart')
    expect(resolved.addressLine).toBe('99/1 Phahonyothin Road')
    expect(resolved.district).toBeNull()
    expect(resolved.usedShopAddress).toBe(true)
  })

  test('borrows the shop name and phone when the delivery ones are blank', () => {
    const resolved = resolveShippingAddress({
      ...shop,
      ...delivery,
      deliveryRecipient: null,
      deliveryPhone: null,
    })
    expect(resolved.recipient).toBe('Somchai Minimart')
    expect(resolved.phone).toBe('021111111')
    // Still the delivery address itself, not the shop's.
    expect(resolved.postalCode).toBe('10310')
    expect(resolved.usedShopAddress).toBe(false)
  })

  test('trims what the form submitted', () => {
    const resolved = resolveShippingAddress({
      ...shop,
      ...delivery,
      deliveryPostalCode: ' 10310 ',
    })
    expect(resolved.postalCode).toBe('10310')
  })
})

describe('formatShippingAddress', () => {
  test('reads in Thai postal order', () => {
    expect(
      formatShippingAddress(resolveShippingAddress({ ...shop, ...delivery }))
    ).toBe(
      'อาคารตัวอย่าง เลขที่ 1 ห้อง 101 ห้วยขวาง ห้วยขวาง กรุงเทพมหานคร 10310'
    )
  })

  test('drops the parts a fallback address does not have', () => {
    // No blank gaps where แขวง and เขต would be.
    expect(
      formatShippingAddress(resolveShippingAddress({ ...shop, ...noDelivery }))
    ).toBe('99/1 Phahonyothin Road Bangkok 10400')
  })
})
