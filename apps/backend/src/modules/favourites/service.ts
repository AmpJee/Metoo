/**
 * Saved products — favourites and save-for-later.
 *
 * One model, two lists. The design puts both icons on every product card and
 * treats them as different intents: a favourite is a lasting preference, a
 * save-for-later is "not this order, maybe the next one". A product can be in
 * both, which is why the unique key includes the kind.
 *
 * Every write is idempotent. These are toggles on a card that people tap
 * twice.
 */
import type { SavedItemKind } from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../middleware/error.ts'

export { retailerIdForUser } from '../../lib/profile.ts'

export async function list(retailerId: string, kind: SavedItemKind) {
  const rows = await prisma.favourite.findMany({
    where: { retailerId, kind },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      product: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          pricePerPackMinor: true,
          minPacks: true,
          unitsPerPack: true,
          category: true,
          isActive: true,
          brand: { select: { id: true, name: true } },
        },
      },
    },
  })

  // A saved product can later be retired. Keep showing it — flagged — rather
  // than having it vanish from the list without explanation.
  return rows.map((row) => ({ savedAt: row.createdAt, ...row.product }))
}

/** Only a product a retailer could actually buy can be saved. */
async function purchasable(productId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
      brand: { user: { status: 'ONBOARDED' } },
    },
    select: { id: true },
  })

  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No such product.')
  }
}

export async function add(
  retailerId: string,
  productId: string,
  kind: SavedItemKind
) {
  await purchasable(productId)

  // upsert, not create: saving something already saved should succeed quietly
  // rather than 409 on the unique index.
  await prisma.favourite.upsert({
    where: {
      retailerId_productId_kind: { retailerId, productId, kind },
    },
    update: {},
    create: { retailerId, productId, kind },
  })

  return { saved: true, kind }
}

export async function remove(
  retailerId: string,
  productId: string,
  kind: SavedItemKind
) {
  // deleteMany rather than delete: removing something not saved is a no-op,
  // which is what an idempotent toggle needs.
  await prisma.favourite.deleteMany({ where: { retailerId, productId, kind } })
  return { saved: false, kind }
}

/**
 * Which lists a product is already in.
 *
 * Lets a card render both icons in the right state from one call rather than
 * checking each list separately.
 */
export async function statusFor(retailerId: string, productId: string) {
  const rows = await prisma.favourite.findMany({
    where: { retailerId, productId },
    select: { kind: true },
  })

  const kinds = new Set(rows.map((r) => r.kind))

  return {
    favourite: kinds.has('FAVOURITE'),
    savedForLater: kinds.has('SAVED_FOR_LATER'),
  }
}
