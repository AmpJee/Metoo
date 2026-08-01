/**
 * An account editing its own profile.
 *
 * The line this module holds is the one the schema already draws: contact
 * details belong to the account, everything under "maintained by admin" —
 * shopType, zone, referralSource, adminNotes and the rest — is outreach data
 * the console owns. A self-edit route that accepted those fields would let a
 * retailer rewrite the notes an admin took about them.
 */
import { prisma } from '../../config/prisma.ts'

/**
 * What a retailer may change about itself, and what it gets back.
 *
 * `paymentReliability` and the pipeline columns are deliberately absent from
 * both directions: not writable, and not worth showing someone a grade the
 * platform assigned them.
 */
const retailerSelect = {
  id: true,
  shopName: true,
  phone: true,
  addressLine: true,
  province: true,
  postalCode: true,
  taxId: true,
  updatedAt: true,
}

export interface RetailerProfilePatch {
  shopName?: string
  phone?: string
  addressLine?: string
  province?: string
  postalCode?: string
  /** Explicitly nullable — a shop that never had a tax ID can clear a typo. */
  taxId?: string | null
}

export function getRetailer(retailerId: string) {
  return prisma.retailerProfile.findUniqueOrThrow({
    where: { id: retailerId },
    select: retailerSelect,
  })
}

/**
 * Note what this does NOT do: past orders keep the address they shipped to.
 * `Order.shippingAddress` is a snapshot taken at checkout precisely so that
 * moving shop cannot rewrite where last month's delivery went.
 */
export function updateRetailer(
  retailerId: string,
  patch: RetailerProfilePatch
) {
  return prisma.retailerProfile.update({
    where: { id: retailerId },
    data: patch,
    select: retailerSelect,
  })
}
