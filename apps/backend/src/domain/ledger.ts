/**
 * The brand wallet ledger — pure, no Prisma, no I/O.
 *
 * The wallet is append-only. A balance is never stored; it is the sum of every
 * row, with credits positive and debits negative. Nothing here updates or
 * deletes an entry — a mistake is corrected by writing a compensating
 * ADJUSTMENT, which keeps the history truthful about what actually happened
 * and when.
 *
 * Signed amounts rather than a type-plus-magnitude scheme mean the balance is
 * one SUM with no branching, and a new entry type cannot accidentally be
 * counted the wrong way round.
 */

export type LedgerType =
  | 'SALE_CREDIT'
  | 'COMMISSION_DEBIT'
  | 'REFUND_DEBIT'
  | 'WITHDRAWAL_DEBIT'
  | 'ADJUSTMENT'

export interface LedgerEntry {
  type: LedgerType
  /** Signed: credits positive, debits negative. Satang. */
  amountMinor: number
}

/**
 * The rows written when an order settles.
 *
 * Two entries, not one net figure: the wallet screen lists the sale and the
 * platform fee as separate lines, and a brand disputing its commission needs
 * to see the gross it was credited before the fee came off.
 */
export function settlementEntries(order: {
  subtotalMinor: number
  commissionMinor: number
}): LedgerEntry[] {
  return [
    { type: 'SALE_CREDIT', amountMinor: order.subtotalMinor },
    { type: 'COMMISSION_DEBIT', amountMinor: -order.commissionMinor },
  ]
}

/** Balance is the sum of everything. Nothing is filtered or special-cased. */
export function computeBalance(entries: LedgerEntry[]): number {
  return entries.reduce((total, entry) => total + entry.amountMinor, 0)
}

export type WithdrawalCheck =
  { ok: true } | { ok: false; code: string; message: string }

/** Below this a transfer costs more in fees and admin time than it moves. */
export const MIN_WITHDRAWAL_MINOR = 10_000 // ฿100.00

/**
 * May a brand withdraw this amount against this balance?
 *
 * Callers must re-run this **inside** the transaction that writes the debit.
 * Checking beforehand and writing afterwards leaves a window in which two
 * concurrent requests both pass and the balance goes negative.
 */
export function checkWithdrawal(
  amountMinor: number,
  balanceMinor: number
): WithdrawalCheck {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    return {
      ok: false,
      code: 'INVALID_AMOUNT',
      message: 'Amount must be a positive whole number of satang.',
    }
  }

  if (amountMinor < MIN_WITHDRAWAL_MINOR) {
    return {
      ok: false,
      code: 'BELOW_MINIMUM',
      message: `The minimum withdrawal is ฿${(
        MIN_WITHDRAWAL_MINOR / 100
      ).toFixed(2)}.`,
    }
  }

  if (amountMinor > balanceMinor) {
    return {
      ok: false,
      code: 'INSUFFICIENT_BALANCE',
      message: `Your available balance is ฿${(balanceMinor / 100).toFixed(2)}.`,
    }
  }

  return { ok: true }
}

/**
 * Money earned but not yet released.
 *
 * The wallet screen shows this beside the available balance: an order that has
 * been delivered but not confirmed as paid is real revenue the brand cannot
 * withdraw yet.
 */
export function pendingClearance(
  deliveredOrders: Array<{ payoutMinor: number }>
): number {
  return deliveredOrders.reduce((total, order) => total + order.payoutMinor, 0)
}
