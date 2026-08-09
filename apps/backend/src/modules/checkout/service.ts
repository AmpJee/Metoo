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
import type {
  PaymentPreference,
  Prisma,
} from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { checkQuantity, groupByBrand } from '../../domain/cart.ts'
import {
  VOLUME_WINDOW_DAYS,
  resolveCommissionBps,
  splitAmount,
} from '../../domain/commission.ts'
import { resolveShippingAddress } from '../../domain/delivery-address.ts'
import { generateOrderNumber } from '../../domain/order-number.ts'
import { parcelWeightGrams, shippingFeeMinor } from '../../domain/shipping.ts'
import { unitPriceMinor } from '../../domain/volume-pricing.ts'
import { COUNTS_TOWARD_VOLUME } from '../../domain/order-state.ts'
import { missingShopFields } from '../../domain/shop-profile.ts'
import { AppError } from '../../middleware/error.ts'

interface CheckoutLine {
  brandId: string
  productId: string
  productName: string
  pricePerPackMinor: number
  /** Null when the product is made to order — there is nothing to take. */
  stockPacks: number | null
  /** Null when the seller has not recorded it; shipping falls back. */
  packWeightGrams: number | null
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
          packWeightGrams: true,
          priceTiers: {
            select: { minPacks: true, pricePerPackMinor: true },
            orderBy: { minPacks: 'asc' },
          },
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
    if (!product.isActive || product.brand.user.status !== 'ONBOARDED') {
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
      // Resolved here, once, and snapshotted onto OrderItem below. The tier
      // the shop qualified for at checkout is the price they pay, and editing
      // the ladder afterwards must not rewrite what they were charged.
      pricePerPackMinor: unitPriceMinor(
        product.pricePerPackMinor,
        product.priceTiers,
        packs
      ),
      packWeightGrams: product.packWeightGrams,
      packs,
      category: product.category,
      // Null means "made to order" — nothing to take.
      stockPacks: product.stockPacks,
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
      status: { in: [...COUNTS_TOWARD_VOLUME] },
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

export async function checkout(params: {
  cartId: string
  retailerId: string
  paymentMethod: PaymentPreference
}) {
  const { cartId, retailerId, paymentMethod } = params

  const retailer = await prisma.retailerProfile.findUnique({
    where: { id: retailerId },
    select: {
      shopName: true,
      phone: true,
      addressLine: true,
      subdistrict: true,
      district: true,
      province: true,
      postalCode: true,
      deliveryRecipient: true,
      deliveryPhone: true,
      deliveryAddressLine: true,
      deliverySubdistrict: true,
      deliveryDistrict: true,
      deliveryProvince: true,
      deliveryPostalCode: true,
      shopType: true,
      zone: true,
      currentProducts: true,
      monthlyCapacity: true,
      preferredPayment: true,
      deliveryWindow: true,
    },
  })

  if (!retailer) {
    throw new AppError(
      404,
      'RETAILER_PROFILE_MISSING',
      'This account has no retailer profile.'
    )
  }

  // Checked here rather than only in the frontend, because these decide
  // whether the order can physically be fulfilled: the zone and delivery
  // window determine the courier run, and finding out afterwards means
  // finding out the order cannot be delivered. Refused before anything is
  // written, so no half-made order is left behind.
  const missing = missingShopFields(retailer)

  if (missing.length > 0) {
    throw new AppError(
      422,
      'SHOP_PROFILE_INCOMPLETE',
      `Complete your shop profile before ordering. Still needed: ${missing
        .map((m) => m.label)
        .join(', ')}.`
    )
  }

  return prisma.$transaction(async (tx) => {
    const lines = await loadAndValidateCart(cartId, tx)
    const groups = groupByBrand(lines)

    // Shared by every order from this basket, so the confirmation screen can
    // show them together and payment can be tracked as one attempt.
    const checkoutGroupId = crypto.randomUUID()

    // The delivery address if there is one, the shop address if not — same
    // for every order in this basket, since one shop is receiving them.
    const shippingAddress = resolveShippingAddress(retailer)

    // Read before anything is written, so all of this basket's orders agree.
    const isFirstOrder = (await tx.order.count({ where: { retailerId } })) === 0

    const orders = []

    for (const group of groups) {
      const category = dominantCategory(group.items)
      const recentOrders = await countRecentOrders(group.brandId, tx)
      // Per brand order, because that is one parcel from one place.
      //
      // `isFirstOrder` is read once before any order exists, so a first
      // checkout spanning three brands has all three delivered free — it is
      // one purchase to the shop making it, and charging two of the three
      // would read as the offer half-working.
      const shipping = shippingFeeMinor({
        weightGrams: parcelWeightGrams(group.items),
        subtotalMinor: group.subtotalMinor,
        isFirstOrder,
      })

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
          // Resolved here and snapshotted, like the commission rate: payment
          // is one manual bank transfer against the total on screen, so the
          // number cannot move afterwards. What the courier actually charges
          // the platform is recorded separately in deliveryCostMinor.
          shippingMinor: shipping,
          totalMinor: group.subtotalMinor + shipping,
          paymentMethod,
          commissionBps,
          commissionMinor,
          payoutMinor,
          // Snapshotted, like the price and the commission rate: a courier
          // reading a two-week-old label must see the address agreed then,
          // not the one the shop edited yesterday.
          // Spread into a plain object: Prisma's Json input type does not
          // accept a declared interface, only a structural literal.
          shippingAddress: { ...shippingAddress },
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

    // Take the stock. Until now checkout only CHECKED it, so the same packs
    // could be sold repeatedly — every order passed the check against a
    // number that never moved.
    //
    // Conditional update rather than read-then-write: `stockPacks: { gte }`
    // makes the decrement atomic, so two checkouts racing for the last packs
    // cannot both succeed. A count of 0 means the other one got there first,
    // and this whole transaction rolls back.
    for (const line of lines) {
      if (line.stockPacks === null) continue

      const taken = await tx.product.updateMany({
        where: { id: line.productId, stockPacks: { gte: line.packs } },
        data: { stockPacks: { decrement: line.packs } },
      })

      if (taken.count === 0) {
        throw new AppError(
          422,
          'INSUFFICIENT_STOCK',
          `${line.productName}: not enough packs left in stock.`
        )
      }
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
