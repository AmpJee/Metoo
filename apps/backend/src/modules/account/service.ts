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
import { accountLast4 } from '../../domain/bank.ts'

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

/**
 * `bankAccountNumber` is absent on purpose — it is admin-only PII, and the
 * brand's own screen has no more business rendering it than anyone else's.
 * The design shows "SCB •••• 4821", which is what the last four digits are
 * for. The wallet summary already takes this line; this select holds it too.
 */
const brandSelect = {
  id: true,
  name: true,
  description: true,
  logoUrl: true,
  phone: true,
  addressLine: true,
  province: true,
  postalCode: true,
  bankName: true,
  bankAccountName: true,
  updatedAt: true,
}

export interface BrandProfilePatch {
  name?: string
  description?: string | null
  phone?: string
  addressLine?: string
  province?: string
  postalCode?: string
}

export interface BankDetails {
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
}

/** Shapes the row so the account number never leaves as more than four digits. */
async function readBrand(brandId: string) {
  const brand = await prisma.brandProfile.findUniqueOrThrow({
    where: { id: brandId },
    select: { ...brandSelect, bankAccountNumber: true },
  })

  const { bankAccountNumber, ...rest } = brand
  return { ...rest, bankAccountLast4: accountLast4(bankAccountNumber) }
}

export function getBrand(brandId: string) {
  return readBrand(brandId)
}

/**
 * The brand name is not snapshotted onto past orders, and that is deliberate.
 * A product's name and price are copied at checkout because they genuinely
 * differ order to order; a brand renaming itself is one continuous business,
 * and showing a retailer the name it trades under now is the truthful answer.
 */
export async function updateBrand(brandId: string, patch: BrandProfilePatch) {
  await prisma.brandProfile.update({ where: { id: brandId }, data: patch })
  return readBrand(brandId)
}

/**
 * All three fields together, or none — hence PUT rather than PATCH.
 *
 * Withdrawal creation requires the full set and 422s without it, so a partial
 * update could only ever produce a half-configured payout that fails later,
 * at the point where a brand is trying to get paid.
 */
export async function replaceBankDetails(brandId: string, bank: BankDetails) {
  await prisma.brandProfile.update({
    where: { id: brandId },
    data: {
      bankName: bank.bankName.trim(),
      bankAccountName: bank.bankAccountName.trim(),
      bankAccountNumber: bank.bankAccountNumber.trim(),
    },
  })

  return readBrand(brandId)
}
