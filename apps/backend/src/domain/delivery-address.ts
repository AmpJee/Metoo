/**
 * Where a parcel actually goes — pure, no Prisma, no I/O.
 *
 * A retailer has two addresses and they are different facts. The shop address
 * says who this business is and where it trades; the delivery address says
 * where a parcel is handed over, which may be a warehouse, a condo lobby, or
 * whoever is in during the day. Sharing one field forced a retailer to pick
 * which of the two truths to store.
 *
 * Resolved at checkout and snapshotted onto `Order.shippingAddress`, like
 * every other thing that can change underneath a completed order. A courier
 * reading a two-week-old label must see the address that was agreed then, not
 * the one the shop edited yesterday.
 */

export interface ShopAddress {
  shopName: string
  phone: string
  addressLine: string
  /**
   * Nullable, unlike the rest of the shop address. Shops that signed up
   * before the area picker existed have the district written into
   * addressLine as prose, and splitting it back out would be guesswork.
   */
  subdistrict: string | null
  district: string | null
  province: string
  postalCode: string
}

/** Every part nullable: the whole section is optional until someone fills it. */
export interface DeliveryAddressFields {
  deliveryRecipient: string | null
  deliveryPhone: string | null
  deliveryAddressLine: string | null
  deliverySubdistrict: string | null
  deliveryDistrict: string | null
  deliveryProvince: string | null
  deliveryPostalCode: string | null
}

/** What gets written onto an order, and printed on a label. */
export interface ShippingAddress {
  /** Who to hand the parcel to. The shop's name when no recipient is named. */
  recipient: string
  phone: string
  addressLine: string
  subdistrict: string | null
  district: string | null
  province: string
  postalCode: string
  /**
   * True when this came from the shop address because no delivery address was
   * set. Recorded on the order so an operator can tell a deliberate address
   * from a fallback when a parcel goes astray.
   */
  usedShopAddress: boolean
}

const filled = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0

/**
 * Is there enough of a delivery address to send a parcel to?
 *
 * The four parts a courier cannot do without. Recipient and phone are not in
 * the test — they fall back to the shop's own, which is a reasonable default
 * and beats refusing to deliver over a name.
 */
export function hasDeliveryAddress(profile: DeliveryAddressFields): boolean {
  return (
    filled(profile.deliveryAddressLine) &&
    filled(profile.deliveryDistrict) &&
    filled(profile.deliveryProvince) &&
    filled(profile.deliveryPostalCode)
  )
}

/**
 * The address to ship to, preferring the delivery one.
 *
 * Falls back to the shop address rather than refusing: a retailer who signed
 * up before the delivery section existed must still be able to order, and
 * their shop address is where their goods used to go anyway.
 */
export function resolveShippingAddress(
  profile: ShopAddress & DeliveryAddressFields
): ShippingAddress {
  if (!hasDeliveryAddress(profile)) {
    return {
      recipient: profile.shopName,
      phone: profile.phone,
      addressLine: profile.addressLine,
      // Carried through now that the shop address has them. Older shops still
      // have null here, which is why the formatter drops empty parts rather
      // than leaving gaps where แขวง and เขต would be.
      subdistrict: filled(profile.subdistrict)
        ? profile.subdistrict.trim()
        : null,
      district: filled(profile.district) ? profile.district.trim() : null,
      province: profile.province,
      postalCode: profile.postalCode,
      usedShopAddress: true,
    }
  }

  return {
    // A named recipient is whoever signs for it; without one, the shop.
    recipient: filled(profile.deliveryRecipient)
      ? profile.deliveryRecipient
      : profile.shopName,
    phone: filled(profile.deliveryPhone)
      ? profile.deliveryPhone
      : profile.phone,
    addressLine: profile.deliveryAddressLine!.trim(),
    subdistrict: filled(profile.deliverySubdistrict)
      ? profile.deliverySubdistrict.trim()
      : null,
    district: profile.deliveryDistrict!.trim(),
    province: profile.deliveryProvince!.trim(),
    postalCode: profile.deliveryPostalCode!.trim(),
    usedShopAddress: false,
  }
}

/**
 * The address as one block of text, in Thai postal order.
 *
 * House and road first, then แขวง/ตำบล, เขต/อำเภอ, จังหวัด, postcode — which
 * is how it is read aloud and how a courier's label is laid out. Missing parts
 * are dropped rather than left as blank lines.
 */
export function formatShippingAddress(address: ShippingAddress): string {
  return [
    address.addressLine,
    address.subdistrict,
    address.district,
    address.province,
    address.postalCode,
  ]
    .filter(filled)
    .join(' ')
}
