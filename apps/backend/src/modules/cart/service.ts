/**
 * The retailer's cart.
 *
 * A cart spans brands; an order never does. `GET /cart` therefore returns the
 * lines already grouped per brand, using the same `groupByBrand` that checkout
 * will use to create one order per group — so what the retailer sees on the
 * cart screen is exactly the split they get.
 *
 * Everything is counted in packs. The minimum-packs rule is enforced on every
 * write rather than at checkout, so an invalid line can never sit in the cart
 * waiting to fail.
 */
import { prisma } from '../../config/prisma.ts'
import { unitPriceMinor } from '../../domain/volume-pricing.ts'
import { checkQuantity, groupByBrand } from '../../domain/cart.ts'
import { AppError } from '../../middleware/error.ts'

export async function cartIdForUser(userId: string): Promise<string> {
  const retailer = await prisma.retailerProfile.findUnique({
    where: { userId },
    select: { id: true, cart: { select: { id: true } } },
  })

  if (!retailer) {
    throw new AppError(
      404,
      'RETAILER_PROFILE_MISSING',
      'This account has no retailer profile.'
    )
  }

  // Registration creates the cart, but accounts seeded or migrated before that
  // may not have one. Creating it lazily costs one query and removes a whole
  // class of "cart is null" failures.
  if (retailer.cart) return retailer.cart.id

  const created = await prisma.cart.create({
    data: { retailerId: retailer.id },
    select: { id: true },
  })

  return created.id
}

/** Load a product and confirm a retailer is allowed to buy it. */
async function purchasableProduct(productId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
      brand: { user: { status: 'ONBOARDED' } },
    },
    select: {
      id: true,
      minPacks: true,
      unitsPerPack: true,
      stockPacks: true,
      pricePerPackMinor: true,
    },
  })

  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No such product.')
  }

  return product
}

/** Turn a domain rule failure into an HTTP error. The domain layer stays
 *  ignorant of HTTP; this is the single place that bridges them. */
function assertQuantity(packs: number, rules: { minPacks: number }) {
  const result = checkQuantity(packs, rules)
  if (!result.ok) {
    throw new AppError(422, result.code, result.message)
  }
}

export async function getCart(cartId: string) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      packs: true,
      product: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          pricePerPackMinor: true,
          minPacks: true,
          unitsPerPack: true,
          isActive: true,
          priceTiers: {
            select: { minPacks: true, pricePerPackMinor: true },
            orderBy: { minPacks: 'asc' },
          },
          brand: { select: { id: true, name: true } },
        },
      },
    },
  })

  // Priced through the domain rule, not by multiplying the base price: a line
  // that qualifies for a volume tier must cost the tier rate here, on the
  // product page and on the invoice, or the platform quotes one number and
  // charges another.
  const lines = items.map((item) => {
    const unit = unitPriceMinor(
      item.product.pricePerPackMinor,
      item.product.priceTiers,
      item.packs
    )

    return {
      id: item.id,
      packs: item.packs,
      brandId: item.product.brand.id,
      pricePerPackMinor: unit,
      lineTotalMinor: unit * item.packs,
      product: item.product,
    }
  })

  const groups = groupByBrand(lines).map((group) => ({
    brand: group.items[0]!.product.brand,
    items: group.items.map((line) => ({
      id: line.id,
      packs: line.packs,
      lineTotalMinor: line.lineTotalMinor,
      // The unit actually charged, so the cart row's arithmetic is visibly
      // its own: packs × this = the line total beside it.
      pricePerPackMinor: line.pricePerPackMinor,
      product: {
        id: line.product.id,
        name: line.product.name,
        photoUrl: line.product.photoUrl,
        pricePerPackMinor: line.product.pricePerPackMinor,
        minPacks: line.product.minPacks,
        unitsPerPack: line.product.unitsPerPack,
        isActive: line.product.isActive,
      },
    })),
    subtotalMinor: group.subtotalMinor,
  }))

  return {
    // One order per group at checkout — surfaced here so the split is never a
    // surprise on the payment screen.
    brandCount: groups.length,
    itemCount: lines.length,
    totalMinor: groups.reduce((sum, g) => sum + g.subtotalMinor, 0),
    groups,
  }
}

export async function addItem(
  cartId: string,
  productId: string,
  packs: number
) {
  const product = await purchasableProduct(productId)
  assertQuantity(packs, product)

  if (product.stockPacks !== null && packs > product.stockPacks) {
    throw new AppError(
      422,
      'INSUFFICIENT_STOCK',
      `Only ${product.stockPacks} packs left in stock.`
    )
  }

  // Adding a product already in the cart replaces the pack count rather than
  // adding to it, so re-submitting a form does not silently double an order.
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { packs },
    create: { cartId, productId, packs },
  })

  return getCart(cartId)
}

export async function updateItem(
  cartId: string,
  itemId: string,
  packs: number
) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId },
    select: { id: true, productId: true },
  })

  if (!item) {
    throw new AppError(404, 'CART_ITEM_NOT_FOUND', 'No such cart item.')
  }

  const product = await purchasableProduct(item.productId)
  assertQuantity(packs, product)

  await prisma.cartItem.update({ where: { id: item.id }, data: { packs } })
  return getCart(cartId)
}

export async function removeItem(cartId: string, itemId: string) {
  // Scoped to cartId so one retailer cannot delete another's line.
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } })
  return getCart(cartId)
}

export async function clear(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } })
  return getCart(cartId)
}
