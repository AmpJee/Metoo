/**
 * Admin review of withdrawal requests.
 *
 * Payouts are manual bank transfers, so this is a work queue: approve, do the
 * transfer in your banking app, then record the reference and mark it paid.
 *
 * The amount already left the brand's balance when the request was raised, so
 * approving costs nothing further — but **rejecting must refund it**, and that
 * refund is a compensating ADJUSTMENT rather than a deletion of the original
 * debit, because the ledger is append-only.
 */
import type { WithdrawalStatus } from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../middleware/error.ts'

/** Full bank details are included: an admin needs them to make the transfer. */
const withdrawalSelect = {
  id: true,
  amountMinor: true,
  status: true,
  bankName: true,
  bankAccountName: true,
  bankAccountNumber: true,
  reviewNote: true,
  reviewedBy: true,
  reviewedAt: true,
  paymentRef: true,
  paidAt: true,
  createdAt: true,
  brand: { select: { id: true, name: true } },
}

export function list(filter: { status?: WithdrawalStatus }) {
  return prisma.withdrawalRequest.findMany({
    where: { status: filter.status },
    select: withdrawalSelect,
    // Oldest first: this is a queue, and the brand who waited longest is paid
    // first.
    orderBy: { createdAt: 'asc' },
  })
}

async function load(withdrawalId: string) {
  const request = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    select: { id: true, status: true, brandId: true, amountMinor: true },
  })

  if (!request) {
    throw new AppError(
      404,
      'WITHDRAWAL_NOT_FOUND',
      'No such withdrawal request.'
    )
  }

  return request
}

export async function approve(params: {
  adminId: string
  withdrawalId: string
  reviewNote?: string
}) {
  const request = await load(params.withdrawalId)

  if (request.status !== 'REQUESTED') {
    throw new AppError(
      422,
      'WITHDRAWAL_ALREADY_REVIEWED',
      `This request is already ${request.status}.`
    )
  }

  // No ledger write: the debit happened when the brand asked.
  return prisma.$transaction(async (tx) => {
    const row = await tx.withdrawalRequest.update({
      where: { id: request.id },
      data: {
        status: 'APPROVED',
        reviewedBy: params.adminId,
        reviewedAt: new Date(),
        reviewNote: params.reviewNote?.trim() ?? null,
      },
      select: withdrawalSelect,
    })

    await tx.auditLog.create({
      data: {
        actorId: params.adminId,
        action: 'WITHDRAWAL_APPROVED',
        entityType: 'WithdrawalRequest',
        entityId: request.id,
        metadata: { amountMinor: request.amountMinor },
      },
    })

    return row
  })
}

export async function reject(params: {
  adminId: string
  withdrawalId: string
  reviewNote: string
}) {
  const request = await load(params.withdrawalId)

  if (request.status !== 'REQUESTED') {
    throw new AppError(
      422,
      'WITHDRAWAL_ALREADY_REVIEWED',
      `This request is already ${request.status}.`
    )
  }

  if (!params.reviewNote.trim()) {
    throw new AppError(
      422,
      'REVIEW_NOTE_REQUIRED',
      'A reviewNote is required when rejecting, so the brand knows why.'
    )
  }

  return prisma.$transaction(async (tx) => {
    const row = await tx.withdrawalRequest.update({
      where: { id: request.id },
      data: {
        status: 'REJECTED',
        reviewedBy: params.adminId,
        reviewedAt: new Date(),
        reviewNote: params.reviewNote.trim(),
      },
      select: withdrawalSelect,
    })

    // Give the money back as a compensating entry. Deleting the original
    // debit would erase the fact that a request was ever made.
    await tx.walletTransaction.create({
      data: {
        brandId: request.brandId,
        withdrawalId: request.id,
        type: 'ADJUSTMENT',
        amountMinor: request.amountMinor,
        note: 'Withdrawal rejected — amount returned to balance',
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: params.adminId,
        action: 'WITHDRAWAL_REJECTED',
        entityType: 'WithdrawalRequest',
        entityId: request.id,
        metadata: {
          amountMinor: request.amountMinor,
          reviewNote: params.reviewNote.trim(),
        },
      },
    })

    return row
  })
}

/**
 * Record that the bank transfer has been made.
 *
 * Only an approved request can be paid: marking a rejected or already-paid one
 * would double-count money that has left the platform.
 */
export async function markPaid(params: {
  adminId: string
  withdrawalId: string
  paymentRef: string
}) {
  const request = await load(params.withdrawalId)

  if (request.status !== 'APPROVED') {
    throw new AppError(
      422,
      'WITHDRAWAL_NOT_APPROVED',
      `Only an approved request can be marked paid; this one is ${request.status}.`
    )
  }

  return prisma.$transaction(async (tx) => {
    const row = await tx.withdrawalRequest.update({
      where: { id: request.id },
      data: {
        status: 'PAID',
        paymentRef: params.paymentRef.trim(),
        paidAt: new Date(),
      },
      select: withdrawalSelect,
    })

    await tx.auditLog.create({
      data: {
        actorId: params.adminId,
        action: 'WITHDRAWAL_PAID',
        entityType: 'WithdrawalRequest',
        entityId: request.id,
        metadata: {
          amountMinor: request.amountMinor,
          paymentRef: params.paymentRef.trim(),
        },
      },
    })

    return row
  })
}
