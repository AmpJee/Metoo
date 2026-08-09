import { describe, expect, test } from 'bun:test'
import type { DeliveryAddressFields, ShopAddress } from './delivery-address.ts'
import {
  formatShippingAddress,
  hasDeliveryAddress,
  resolveShippingAddress,
} from './delivery-address.ts'

const shop: ShopAddress = {
  shopName: 'Somchai Minimart',
  phone: '021111111',
  addressLine: '42 Sukhumvit Soi 31',
  province: 'Bangkok',
  postalCode: '10110',
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
  deliveryRecipient: 'จีรนันท์ ตาบุดดา',
  deliveryPhone: '0659554193',
  deliveryAddressLine: 'The bloc residence, เลขที่ 112, ห้องเลขที่ 705',
  deliverySubdistrict: 'ดินแดง',
  deliveryDistrict: 'ดินแดง',
  deliveryProvince: 'กรุงเทพมหานคร',
  deliveryPostalCode: '10400',
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
    expect(resolved.recipient).toBe('จีรนันท์ ตาบุดดา')
    expect(resolved.phone).toBe('0659554193')
    expect(resolved.district).toBe('ดินแดง')
    expect(resolved.postalCode).toBe('10400')
    expect(resolved.usedShopAddress).toBe(false)
  })

  test('falls back to the shop address, and says so', () => {
    // A retailer who signed up before the delivery section existed must still
    // be able to order — and an operator chasing a lost parcel needs to know
    // the address was inherited rather than chosen.
    const resolved = resolveShippingAddress({ ...shop, ...noDelivery })
    expect(resolved.recipient).toBe('Somchai Minimart')
    expect(resolved.addressLine).toBe('42 Sukhumvit Soi 31')
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
    expect(resolved.postalCode).toBe('10400')
    expect(resolved.usedShopAddress).toBe(false)
  })

  test('trims what the form submitted', () => {
    const resolved = resolveShippingAddress({
      ...shop,
      ...delivery,
      deliveryPostalCode: ' 10400 ',
    })
    expect(resolved.postalCode).toBe('10400')
  })
})

describe('formatShippingAddress', () => {
  test('reads in Thai postal order', () => {
    expect(
      formatShippingAddress(resolveShippingAddress({ ...shop, ...delivery }))
    ).toBe(
      'The bloc residence, เลขที่ 112, ห้องเลขที่ 705 ดินแดง ดินแดง กรุงเทพมหานคร 10400'
    )
  })

  test('drops the parts a fallback address does not have', () => {
    // No blank gaps where แขวง and เขต would be.
    expect(
      formatShippingAddress(resolveShippingAddress({ ...shop, ...noDelivery }))
    ).toBe('42 Sukhumvit Soi 31 Bangkok 10110')
  })
})
