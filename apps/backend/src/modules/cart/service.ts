/**
 * The retailer's cart.
 *
 * A cart spans brands; an order never does. `GET /cart` therefore returns the
 * lines already grouped per brand, using the same `groupByBrand` that checkout
 * will use to create one order per group — so what the retailer sees on the
 * cart screen is exactly the split they get.
 *
 * Quantity rules (MOQ, case size) are enforced on every write rather than at
 * checkout, so an invalid line can never sit in the cart waiting to fail.
 */
import { prisma } from '../../config/prisma.ts'
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
      brand: { user: { status: 'APPROVED' } },
    },
    select: {
      id: true,
      moq: true,
      caseSize: true,
      stockQty: true,
      unitPriceMinor: true,
    },
  })

  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No such product.')
  }

  return product
}

/** Turn a domain rule failure into an HTTP error. The domain layer stays
 *  ignorant of HTTP; this is the single place that bridges them. */
function assertQuantity(
  quantity: number,
  rules: { moq: number; caseSize: number }
) {
  const result = checkQuantity(quantity, rules)
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
      quantity: true,
      product: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          unitPriceMinor: true,
          moq: true,
          caseSize: true,
          isActive: true,
          brand: { select: { id: true, name: true } },
        },
      },
    },
  })

  const lines = items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    brandId: item.product.brand.id,
    unitPriceMinor: item.product.unitPriceMinor,
    lineTotalMinor: item.product.unitPriceMinor * item.quantity,
    product: item.product,
  }))

  const groups = groupByBrand(lines).map((group) => ({
    brand: group.items[0]!.product.brand,
    items: group.items.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      lineTotalMinor: line.lineTotalMinor,
      product: {
        id: line.product.id,
        name: line.product.name,
        photoUrl: line.product.photoUrl,
        unitPriceMinor: line.product.unitPriceMinor,
        moq: line.product.moq,
        caseSize: line.product.caseSize,
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
  quantity: number
) {
  const product = await purchasableProduct(productId)
  assertQuantity(quantity, product)

  if (product.stockQty !== null && quantity > product.stockQty) {
    throw new AppError(
      422,
      'INSUFFICIENT_STOCK',
      `Only ${product.stockQty} left in stock.`
    )
  }

  // Adding a product already in the cart replaces the quantity rather than
  // summing: summing could land on a non-multiple of the case size and would
  // surprise anyone who re-submitted a form.
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity },
    create: { cartId, productId, quantity },
  })

  return getCart(cartId)
}

export async function updateItem(
  cartId: string,
  itemId: string,
  quantity: number
) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId },
    select: { id: true, productId: true },
  })

  if (!item) {
    throw new AppError(404, 'CART_ITEM_NOT_FOUND', 'No such cart item.')
  }

  const product = await purchasableProduct(item.productId)
  assertQuantity(quantity, product)

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } })
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
