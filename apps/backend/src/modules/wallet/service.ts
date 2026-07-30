/**
 * The brand wallet.
 *
 * Balance is always derived — `SUM(amountMinor)` over the ledger — never read
 * from a stored column. A stored balance and an append-only ledger are two
 * sources of truth for the same number, and they drift the first time a write
 * half-fails.
 */
import { prisma } from '../../config/prisma.ts'
import { MIN_WITHDRAWAL_MINOR, checkWithdrawal } from '../../domain/ledger.ts'
import { AppError } from '../../middleware/error.ts'

/** Ledger sum for one brand, in satang. */
export async function balanceMinor(brandId: string): Promise<number> {
  const result = await prisma.walletTransaction.aggregate({
    where: { brandId },
    _sum: { amountMinor: true },
  })

  return result._sum.amountMinor ?? 0
}

/**
 * Balance, plus what is earned but not yet released.
 *
 * Pending clearance is the payout on orders that have been delivered but not
 * confirmed as paid. The design shows it beside the available balance with the
 * note "Released once orders reach Money Received".
 */
export async function summary(brandId: string) {
  const [available, pending, bank] = await Promise.all([
    balanceMinor(brandId),
    prisma.order.aggregate({
      where: { brandId, status: 'DELIVERED' },
      _sum: { payoutMinor: true },
    }),
    prisma.brandProfile.findUnique({
      where: { id: brandId },
      select: { bankName: true, bankAccountNumber: true },
    }),
  ])

  return {
    availableMinor: available,
    pendingClearanceMinor: pending._sum.payoutMinor ?? 0,
    minWithdrawalMinor: MIN_WITHDRAWAL_MINOR,
    bankName: bank?.bankName ?? null,
    // Last four digits only. The full number is admin-only PII and has no
    // business on the brand's own wallet screen either — the design shows
    // "SCB •••• 4821".
    bankAccountLast4: bank?.bankAccountNumber?.slice(-4) ?? null,
  }
}

/**
 * Ledger history, newest first.
 *
 * Each row carries the order number or withdrawal it came from so the screen
 * can label it "Payout · Order MT260722H" without a second lookup.
 */
export async function transactions(brandId: string, limit: number) {
  const rows = await prisma.walletTransaction.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      amountMinor: true,
      note: true,
      createdAt: true,
      order: { select: { id: true, orderNumber: true } },
      withdrawal: { select: { id: true, bankName: true } },
    },
  })

  return rows
}

/**
 * Raise a withdrawal request.
 *
 * The balance is re-read **inside** the transaction and the debit written in
 * the same one, so two concurrent requests cannot both pass the check and
 * overdraw the wallet.
 *
 * Bank details are copied onto the request rather than referenced: the brand
 * may edit its profile later, and this record has to keep showing where the
 * money was actually sent.
 */
export async function requestWithdrawal(params: {
  brandId: string
  amountMinor: number
}) {
  const { brandId, amountMinor } = params

  const brand = await prisma.brandProfile.findUnique({
    where: { id: brandId },
    select: { bankName: true, bankAccountName: true, bankAccountNumber: true },
  })

  if (!brand?.bankName || !brand.bankAccountName || !brand.bankAccountNumber) {
    throw new AppError(
      422,
      'BANK_DETAILS_MISSING',
      'Add your bank details before requesting a withdrawal.'
    )
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.walletTransaction.aggregate({
      where: { brandId },
      _sum: { amountMinor: true },
    })

    const check = checkWithdrawal(amountMinor, current._sum.amountMinor ?? 0)
    if (!check.ok) {
      throw new AppError(422, check.code, check.message)
    }

    const request = await tx.withdrawalRequest.create({
      data: {
        brandId,
        amountMinor,
        status: 'REQUESTED',
        bankName: brand.bankName!,
        bankAccountName: brand.bankAccountName!,
        bankAccountNumber: brand.bankAccountNumber!,
      },
    })

    // Debited on request, not on approval: the money is spoken for the moment
    // it is asked for, otherwise a brand could raise several requests that
    // each pass on their own and together exceed the balance.
    await tx.walletTransaction.create({
      data: {
        brandId,
        withdrawalId: request.id,
        type: 'WITHDRAWAL_DEBIT',
        amountMinor: -amountMinor,
      },
    })

    return request
  })
}

export function listWithdrawals(brandId: string) {
  return prisma.withdrawalRequest.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      amountMinor: true,
      status: true,
      bankName: true,
      bankAccountName: true,
      reviewNote: true,
      paymentRef: true,
      paidAt: true,
      createdAt: true,
    },
  })
}
