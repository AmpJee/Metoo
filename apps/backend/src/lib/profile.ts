/**
 * Resolving a user to their brand or retailer profile.
 *
 * Route guards prove the caller's role, but the access token carries a *user*
 * id while products, orders and carts all hang off BrandProfile or
 * RetailerProfile. Nearly every module needs this hop, so it lives here rather
 * than being redefined per module — otherwise a module ends up importing an
 * unrelated one just to reuse the lookup.
 */
import { prisma } from '../config/prisma.ts'
import { AppError } from '../middleware/error.ts'

export async function brandIdForUser(userId: string): Promise<string> {
  const brand = await prisma.brandProfile.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!brand) {
    // Registration creates User and BrandProfile in one transaction, so a
    // missing profile means the data was edited out of band.
    throw new AppError(
      404,
      'BRAND_PROFILE_MISSING',
      'This account has no brand profile.'
    )
  }

  return brand.id
}

export async function retailerIdForUser(userId: string): Promise<string> {
  const retailer = await prisma.retailerProfile.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!retailer) {
    throw new AppError(
      404,
      'RETAILER_PROFILE_MISSING',
      'This account has no retailer profile.'
    )
  }

  return retailer.id
}
