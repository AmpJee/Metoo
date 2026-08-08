/**
 * Retailer order views.
 *
 * Almost read-only. The retailer owns exactly one move — confirming a
 * DELIVERED order, which settles it and releases the brand's money. Everything
 * before that is the brand's acceptance and admin's logistics.
 *
 * Every query is scoped to the calling retailer, and someone else's order id
 * reports 404 rather than 403, matching the rule products already follow: a 403
 * confirms the id is real.
 */
import type { OrderStatus, Prisma } from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { checkDocument, paymentSlipKey } from '../../domain/upload.ts'
import {
  PRIVATE_BUCKET,
  createDocumentUploadUrl,
  objectExists,
} from '../../lib/supabase.ts'
import { AppError } from '../../middleware/error.ts'
import { transition } from '../brand-orders/service.ts'

/**
 * Commission is deliberately absent.
 *
 * commissionBps, commissionMinor and payoutMinor are the platform's
 * arrangement with the brand. A retailer pays the total either way and has no
 * business seeing what cut the brand gives up.
 */
const orderSelect = {
  id: true,
  orderNumber: true,
  checkoutGroupId: true,
  status: true,
  subtotalMinor: true,
  shippingMinor: true,
  totalMinor: true,
  shippingAddress: true,
  // The date, never the key. A buyer needs to know their slip arrived; the
  // path to the object is an admin's business, and handing it out would let a
  // caller name it back on a confirm.
  paymentSlipAt: true,
  paymentConfirmedAt: true,
  confirmedAt: true,
  pickedUpAt: true,
  deliveredAt: true,
  createdAt: true,
  brand: { select: { id: true, name: true, logoUrl: true } },
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
} satisfies Prisma.OrderSelect

export function listForRetailer(
  retailerId: string,
  filter: { status?: OrderStatus }
) {
  return prisma.order.findMany({
    where: { retailerId, status: filter.status },
    select: orderSelect,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getForRetailer(retailerId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, retailerId },
    select: orderSelect,
  })

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'No such order.')
  }

  return order
}

/**
 * The retailer confirms they received the goods.
 *
 * This is step 5 -> 6, and it is the step that writes the brand's wallet
 * credit. Delegating to the shared `transition` rather than updating the row
 * here is what guarantees the ledger rows are written in the same transaction
 * as the status change — the settlement logic exists once, not once per
 * caller.
 *
 * The state machine rejects this on any status other than DELIVERED, so a
 * retailer cannot settle an order that has not arrived.
 */
export async function confirmDelivered(params: {
  retailerId: string
  userId: string
  orderId: string
}) {
  await transition({
    retailerId: params.retailerId,
    orderId: params.orderId,
    to: 'SETTLED',
    actor: 'RETAILER',
    actorUserId: params.userId,
  })

  // Re-read through the retailer's own select: `transition` returns the
  // seller's shape, which carries the commission fields a buyer must not see.
  return getForRetailer(params.retailerId, params.orderId)
}

// --- payment slips -----------------------------------------------------------

/**
 * An order this retailer owns that is still waiting to be paid.
 *
 * The status check is the point: a slip is evidence for the one decision an
 * admin has to make, and accepting one against an order already confirmed
 * would quietly replace the evidence behind a decision that is made.
 */
async function payableOrder(retailerId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, retailerId },
    select: { id: true, status: true },
  })

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'No such order.')
  }

  if (order.status !== 'PENDING') {
    throw new AppError(
      422,
      'ORDER_NOT_AWAITING_PAYMENT',
      'This order is no longer awaiting payment.'
    )
  }

  return order
}

/**
 * Step one of the upload: a URL the browser can PUT the slip to.
 *
 * The key is built here from the caller's own retailer id, never taken from
 * the request — a signed URL is a capability, and letting a client name its
 * own path is what would let one retailer write into another's folder.
 */
export async function requestSlipUpload(params: {
  retailerId: string
  orderId: string
  contentType: string
  sizeBytes: number
}) {
  await payableOrder(params.retailerId, params.orderId)

  const check = checkDocument(params.contentType, params.sizeBytes)
  if (!check.ok) {
    throw new AppError(422, check.code, check.message)
  }

  return createDocumentUploadUrl(
    paymentSlipKey({
      retailerId: params.retailerId,
      orderId: params.orderId,
      extension: check.extension,
    })
  )
}

/**
 * Step two: record the slip, once it is really in the bucket.
 *
 * Both checks matter. The prefix check stops a caller pointing at somebody
 * else's object; the existence check stops an order claiming a slip that never
 * finished uploading, which would show an admin a broken link and no way to
 * tell whether the buyer had paid.
 *
 * Re-uploading replaces the key rather than keeping a history — a buyer whose
 * first photo was unreadable is correcting the evidence, not adding to it.
 */
export async function confirmSlipUpload(params: {
  retailerId: string
  orderId: string
  storageKey: string
}) {
  await payableOrder(params.retailerId, params.orderId)

  const prefix = `retailers/${params.retailerId}/slips/${params.orderId}/`
  if (
    !params.storageKey.startsWith(prefix) ||
    params.storageKey.split('/').includes('..')
  ) {
    throw new AppError(
      403,
      'KEY_NOT_YOURS',
      'That upload does not belong to this order.'
    )
  }

  if (!(await objectExists(PRIVATE_BUCKET, params.storageKey))) {
    throw new AppError(
      422,
      'UPLOAD_NOT_FOUND',
      'No file was found at that key. Upload it before confirming.'
    )
  }

  await prisma.order.update({
    where: { id: params.orderId },
    data: { paymentSlipKey: params.storageKey, paymentSlipAt: new Date() },
  })

  return getForRetailer(params.retailerId, params.orderId)
}

/**
 * Every order created by one checkout.
 *
 * The confirmation screen needs all N at once — a retailer who checked out a
 * three-brand basket thinks of it as one purchase, even though it became three
 * independently payable orders.
 */
export async function getGroupForRetailer(
  retailerId: string,
  checkoutGroupId: string
) {
  const orders = await prisma.order.findMany({
    where: { checkoutGroupId, retailerId },
    select: orderSelect,
    orderBy: { createdAt: 'asc' },
  })

  if (orders.length === 0) {
    throw new AppError(404, 'ORDER_GROUP_NOT_FOUND', 'No such checkout.')
  }

  return {
    checkoutGroupId,
    orderCount: orders.length,
    totalMinor: orders.reduce((sum, order) => sum + order.totalMinor, 0),
    orders,
  }
}
