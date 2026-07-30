/**
 * Checkout — turning one cart into N orders, one per brand.
 *
 * This is the most correctness-critical code in the project, so three things
 * are deliberate:
 *
 *   1. **One order per brand.** A cart spanning three brands creates three
 *      Order rows sharing a checkoutGroupId, each independently payable. Never
 *      one order per checkout session — a brand must be able to confirm, ship
 *      and be paid for its own goods without waiting on anyone else's.
 *
 *   2. **Everything is snapshotted.** Commission rate, product name, unit
 *      price and shipping address are all copied onto the order. A brand
 *      editing a price tomorrow must not silently rewrite what was sold today.
 *
 *   3. **The cart is re-validated first.** A cart can sit for days while the
 *      brand changes its MOQ, retires the product, or sells out. Trusting what
 *      was valid when the item was added is how you take an order you cannot
 *      fulfil.
 *
 * The whole thing runs in one transaction: N orders, their items, and the
 * cart clear either all happen or none do.
 */
import type { Prisma } from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { checkQuantity, groupByBrand } from '../../domain/cart.ts'
import {
  VOLUME_WINDOW_DAYS,
  resolveCommissionBps,
  splitAmount,
} from '../../domain/commission.ts'
import { generateOrderNumber } from '../../domain/order-number.ts'
import { AppError } from '../../middleware/error.ts'

/** Orders that count toward a brand's volume tier. */
const VOLUME_COUNTED_STATUSES = [
  'CONFIRMED',
  'PREPARING',
  'PICKED_UP',
  'DELIVERED',
  'SETTLED',
] as const

interface CheckoutLine {
  brandId: string
  productId: string
  productName: string
  pricePerPackMinor: number
  packs: number
  category: Prisma.ProductGetPayload<object>['category']
}

/**
 * Re-check every line against the product as it stands right now.
 *
 * Fails on the first problem, naming the product — "your cart is invalid" is
 * not something a retailer can act on.
 */
async function loadAndValidateCart(
  cartId: string,
  tx: Prisma.TransactionClient
): Promise<CheckoutLine[]> {
  const items = await tx.cartItem.findMany({
    where: { cartId },
    select: {
      packs: true,
      product: {
        select: {
          id: true,
          name: true,
          pricePerPackMinor: true,
          minPacks: true,
          unitsPerPack: true,
          category: true,
          isActive: true,
          stockPacks: true,
          brandId: true,
          brand: { select: { user: { select: { status: true } } } },
        },
      },
    },
  })

  if (items.length === 0) {
    throw new AppError(422, 'CART_EMPTY', 'Your cart is empty.')
  }

  return items.map(({ packs, product }) => {
    if (!product.isActive || product.brand.user.status !== 'APPROVED') {
      throw new AppError(
        422,
        'PRODUCT_UNAVAILABLE',
        `${product.name} is no longer available. Remove it to continue.`
      )
    }

    const check = checkQuantity(packs, product)
    if (!check.ok) {
      throw new AppError(422, check.code, `${product.name}: ${check.message}`)
    }

    if (product.stockPacks !== null && packs > product.stockPacks) {
      throw new AppError(
        422,
        'INSUFFICIENT_STOCK',
        `${product.name}: only ${product.stockPacks} packs left in stock.`
      )
    }

    return {
      brandId: product.brandId,
      productId: product.id,
      productName: product.name,
      pricePerPackMinor: product.pricePerPackMinor,
      packs,
      category: product.category,
    }
  })
}

/**
 * How many orders this brand has taken in the trailing window.
 *
 * PENDING orders are excluded: an unpaid order is not a sale, and counting it
 * would let a brand reach the discounted tier by placing orders that never get
 * paid for. CANCELLED and CLOSED are excluded for the same reason.
 */
function countRecentOrders(brandId: string, tx: Prisma.TransactionClient) {
  const since = new Date(Date.now() - VOLUME_WINDOW_DAYS * 86_400_000)

  return tx.order.count({
    where: {
      brandId,
      status: { in: [...VOLUME_COUNTED_STATUSES] },
      createdAt: { gte: since },
    },
  })
}

/**
 * The category a brand's commission is priced on.
 *
 * An order can span categories, so pick the one carrying the most value. That
 * is the least surprising reading of "commission is tiered by category" when
 * the order is mixed, and it cannot be gamed by padding an order with cheap
 * items from a low-rate category.
 */
function dominantCategory(lines: CheckoutLine[]): CheckoutLine['category'] {
  const totals = new Map<CheckoutLine['category'], number>()

  for (const line of lines) {
    const value = line.pricePerPackMinor * line.packs
    totals.set(line.category, (totals.get(line.category) ?? 0) + value)
  }

  return [...totals].sort((a, b) => b[1] - a[1])[0]![0]
}

export async function checkout(params: { cartId: string; retailerId: string }) {
  const { cartId, retailerId } = params

  const retailer = await prisma.retailerProfile.findUnique({
    where: { id: retailerId },
    select: {
      shopName: true,
      phone: true,
      addressLine: true,
      province: true,
      postalCode: true,
    },
  })

  if (!retailer) {
    throw new AppError(
      404,
      'RETAILER_PROFILE_MISSING',
      'This account has no retailer profile.'
    )
  }

  return prisma.$transaction(async (tx) => {
    const lines = await loadAndValidateCart(cartId, tx)
    const groups = groupByBrand(lines)

    // Shared by every order from this basket, so the confirmation screen can
    // show them together and payment can be tracked as one attempt.
    const checkoutGroupId = crypto.randomUUID()

    const orders = []

    for (const group of groups) {
      const category = dominantCategory(group.items)
      const recentOrders = await countRecentOrders(group.brandId, tx)
      const commissionBps = resolveCommissionBps(category, recentOrders)
      const { commissionMinor, payoutMinor } = splitAmount(
        group.subtotalMinor,
        commissionBps
      )

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          checkoutGroupId,
          retailerId,
          brandId: group.brandId,
          status: 'PENDING',
          subtotalMinor: group.subtotalMinor,
          // Shipping is not modelled yet — manual logistics at MVP.
          shippingMinor: 0,
          totalMinor: group.subtotalMinor,
          commissionBps,
          commissionMinor,
          payoutMinor,
          shippingAddress: {
            shopName: retailer.shopName,
            phone: retailer.phone,
            addressLine: retailer.addressLine,
            province: retailer.province,
            postalCode: retailer.postalCode,
          },
          items: {
            create: group.items.map((line) => ({
              productId: line.productId,
              productName: line.productName,
              pricePerPackMinor: line.pricePerPackMinor,
              packs: line.packs,
              lineTotalMinor: line.pricePerPackMinor * line.packs,
            })),
          },
        },
        select: {
          id: true,
          orderNumber: true,
          checkoutGroupId: true,
          status: true,
          subtotalMinor: true,
          totalMinor: true,
          commissionBps: true,
          commissionMinor: true,
          payoutMinor: true,
          createdAt: true,
          brand: { select: { id: true, name: true } },
          items: {
            select: {
              id: true,
              productId: true,
              productName: true,
              pricePerPackMinor: true,
              packs: true,
              lineTotalMinor: true,
            },
          },
        },
      })

      orders.push(order)
    }

    // Only once every order exists. Clearing earlier would lose the cart if a
    // later order failed and rolled the transaction back.
    await tx.cartItem.deleteMany({ where: { cartId } })

    return {
      checkoutGroupId,
      orderCount: orders.length,
      totalMinor: orders.reduce((sum, order) => sum + order.totalMinor, 0),
      orders,
    }
  })
}
