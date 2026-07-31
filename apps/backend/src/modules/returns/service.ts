/**
 * Returns.
 *
 * A retailer raises one against a delivered order; the brand or an admin
 * decides it. Accepting refunds the retailer, unwinds the brand's wallet and
 * closes the order — all in one transaction, because a refund recorded without
 * the matching ledger row would leave the brand paid for goods that came back.
 */
import { prisma } from '../../config/prisma.ts'
import {
  canRequestReturn,
  canReviewReturn,
  refundEntries,
  statusAfterReview,
} from '../../domain/returns.ts'
import { AppError } from '../../middleware/error.ts'

const returnSelect = {
  id: true,
  reason: true,
  photoUrls: true,
  status: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalMinor: true,
      brand: { select: { id: true, name: true } },
      retailer: { select: { id: true, shopName: true } },
    },
  },
}

export async function requestReturn(params: {
  retailerId: string
  orderId: string
  reason: string
  photoUrls?: string[]
}) {
  const { retailerId, orderId, reason, photoUrls } = params

  const order = await prisma.order.findFirst({
    // Scoped to the retailer: another retailer's order id is a 404, not a 403.
    where: { id: orderId, retailerId },
    select: { id: true, status: true, returnRequest: { select: { id: true } } },
  })

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'No such order.')
  }

  const check = canRequestReturn(order.status, order.returnRequest !== null)
  if (!check.ok) {
    throw new AppError(422, check.code, check.message)
  }

  return prisma.returnRequest.create({
    data: {
      orderId: order.id,
      reason: reason.trim(),
      photoUrls: photoUrls ?? [],
    },
    select: returnSelect,
  })
}

export function listForRetailer(retailerId: string) {
  return prisma.returnRequest.findMany({
    where: { order: { retailerId } },
    select: returnSelect,
    orderBy: { createdAt: 'desc' },
  })
}

/** Brand sees returns against its own orders; admin sees everything. */
export function listForReviewer(scope: { brandId?: string }) {
  return prisma.returnRequest.findMany({
    where: scope.brandId ? { order: { brandId: scope.brandId } } : {},
    select: returnSelect,
    // Oldest first: this is a queue.
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Decide a return.
 *
 * Accepting does four things together — record the refund, unwind the wallet,
 * close the order, and write the audit row. Any of them landing without the
 * others leaves the books wrong, so they share one transaction.
 */
export async function reviewReturn(params: {
  returnId: string
  decision: 'ACCEPTED' | 'REJECTED'
  reviewNote?: string
  reviewerUserId: string
  /** Set for a brand reviewer; absent for an admin, who is not scoped. */
  brandId?: string
  /** Bank reference for the money actually sent back. */
  refundReference?: string
}) {
  const {
    returnId,
    decision,
    reviewNote,
    reviewerUserId,
    brandId,
    refundReference,
  } = params

  const request = await prisma.returnRequest.findFirst({
    where: {
      id: returnId,
      ...(brandId ? { order: { brandId } } : {}),
    },
    select: {
      id: true,
      status: true,
      order: {
        select: {
          id: true,
          status: true,
          brandId: true,
          totalMinor: true,
          payoutMinor: true,
        },
      },
    },
  })

  if (!request) {
    throw new AppError(404, 'RETURN_NOT_FOUND', 'No such return request.')
  }

  const check = canReviewReturn(request.status)
  if (!check.ok) {
    throw new AppError(422, check.code, check.message)
  }

  if (decision === 'REJECTED' && !reviewNote?.trim()) {
    throw new AppError(
      422,
      'REVIEW_NOTE_REQUIRED',
      'A reviewNote is required when rejecting, so the retailer knows why.'
    )
  }

  const { order } = request
  const ledger = refundEntries(order)
  const nextStatus = statusAfterReview(order.status, decision)

  return prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.update({
      where: { id: request.id },
      data: {
        status: decision,
        reviewNote: reviewNote?.trim() ?? null,
        reviewedBy: reviewerUserId,
        reviewedAt: new Date(),
      },
      select: returnSelect,
    })

    if (decision === 'ACCEPTED') {
      // The retailer gets the whole order back, including the platform's cut.
      await tx.refund.create({
        data: {
          orderId: order.id,
          amountMinor: order.totalMinor,
          reference: refundReference?.trim() ?? null,
          reason: 'Return accepted',
          issuedBy: reviewerUserId,
        },
      })

      // Empty when the order never settled — nothing was credited, so there is
      // nothing to take back.
      if (ledger.length > 0) {
        await tx.walletTransaction.createMany({
          data: ledger.map((entry) => ({
            brandId: order.brandId,
            orderId: order.id,
            type: entry.type,
            amountMinor: entry.amountMinor,
            note: 'Return accepted',
          })),
        })
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: nextStatus, closedAt: new Date() },
      })
    }

    await tx.auditLog.create({
      data: {
        actorId: reviewerUserId,
        action: `RETURN_${decision}`,
        entityType: 'ReturnRequest',
        entityId: request.id,
        metadata: {
          orderId: order.id,
          orderStatusBefore: order.status,
          orderStatusAfter: nextStatus,
          refundedMinor: decision === 'ACCEPTED' ? order.totalMinor : 0,
          walletDebitMinor: ledger[0]?.amountMinor ?? 0,
        },
      },
    })

    return updated
  })
}
