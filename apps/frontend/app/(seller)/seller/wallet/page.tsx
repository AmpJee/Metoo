import { WITHDRAWAL_STATUS_LABELS } from '@metoo/shared'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/dashboard-shell'
import { Pill } from '@/components/console/pill'
import { StatTile } from '@/components/console/stat-tile'
import { Table, TBody, TD, TH, THead, TR } from '@/components/console/table'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import type {
  WalletBalance,
  WalletTransaction,
  WalletTxnType,
  Withdrawal,
  WithdrawalStatus,
} from '@/lib/types'
import { WithdrawForm } from './withdraw-form'

export const metadata: Metadata = { title: 'Wallet' }

const TXN_LABELS: Record<WalletTxnType, string> = {
  SALE_CREDIT: 'Sale',
  COMMISSION_DEBIT: 'Commission',
  REFUND_DEBIT: 'Refund',
  WITHDRAWAL_DEBIT: 'Withdrawal',
  ADJUSTMENT: 'Adjustment',
}

const WITHDRAWAL_TONE: Record<
  WithdrawalStatus,
  'warning' | 'info' | 'success' | 'danger'
> = {
  REQUESTED: 'warning',
  APPROVED: 'info',
  PAID: 'success',
  REJECTED: 'danger',
}

export default async function SellerWalletPage() {
  const [balance, transactions, withdrawals] = await Promise.all([
    api.get<WalletBalance>('/wallet'),
    api.get<WalletTransaction[]>('/wallet/transactions'),
    api.get<Withdrawal[]>('/wallet/withdrawals'),
  ])

  return (
    <>
      <PageHeader
        title="Wallet"
        description="Your balance is the sum of the ledger below — every sale, commission and payout."
      />

      <div className="flex flex-col gap-[20px]">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatTile
            label="Available balance"
            value={formatBaht(balance.availableMinor)}
            tint="primary"
          />
          <StatTile
            label="Pending clearance"
            value={formatBaht(balance.pendingClearanceMinor)}
            hint="Delivered, not yet confirmed as Money Received"
          />
          <StatTile
            label="Bank account"
            value={
              balance.bankAccountLast4
                ? `····${balance.bankAccountLast4}`
                : 'Not set'
            }
            hint={balance.bankName ?? 'Contact support to add one'}
          />
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <h2 className="text-[16px] font-semibold">Ledger</h2>
              {transactions.length === 0 ? (
                <p className="rounded-[9px] bg-white px-4 py-8 text-center text-[15px] text-black/50">
                  Nothing yet. Sales appear here when an order reaches Money
                  Received.
                </p>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Date</TH>
                      <TH>Type</TH>
                      <TH>Reference</TH>
                      <TH className="text-right">Amount</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {transactions.map((txn) => (
                      <TR key={txn.id}>
                        <TD className="whitespace-nowrap text-black/50">
                          {formatDate(txn.createdAt)}
                        </TD>
                        <TD>{TXN_LABELS[txn.type]}</TD>
                        <TD className="text-black/50">
                          {txn.order ? (
                            <Link
                              href={`/seller/orders/${txn.order.id}`}
                              className="hover:text-[#cb2957]"
                            >
                              {txn.order.orderNumber}
                            </Link>
                          ) : (
                            (txn.withdrawal?.bankName ?? txn.note ?? '—')
                          )}
                        </TD>
                        {/* Signed amounts: credits positive, debits negative.
                            Colour follows the sign, not the type. */}
                        <TD
                          numeric
                          className={
                            txn.amountMinor >= 0
                              ? 'text-[#1f7a4d]'
                              : 'text-black/50'
                          }
                        >
                          {txn.amountMinor >= 0 ? '+' : '−'}
                          {formatBaht(Math.abs(txn.amountMinor))}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-[16px] font-semibold">Withdrawals</h2>
              {withdrawals.length === 0 ? (
                <p className="rounded-[9px] bg-white px-4 py-8 text-center text-[15px] text-black/50">
                  No withdrawal requests yet.
                </p>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Requested</TH>
                      <TH>To</TH>
                      <TH>Status</TH>
                      <TH className="text-right">Amount</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {withdrawals.map((item) => (
                      <TR key={item.id}>
                        <TD className="whitespace-nowrap text-black/50">
                          {formatDate(item.createdAt)}
                        </TD>
                        <TD>
                          {item.bankName}
                          <span className="block text-[13px] text-black/50">
                            {item.bankAccountName}
                          </span>
                        </TD>
                        <TD>
                          <Pill tone={WITHDRAWAL_TONE[item.status]}>
                            {WITHDRAWAL_STATUS_LABELS[item.status]}
                          </Pill>
                          {item.reviewNote ? (
                            <span className="block max-w-[220px] text-[13px] text-black/50">
                              {item.reviewNote}
                            </span>
                          ) : null}
                        </TD>
                        <TD numeric>{formatBaht(item.amountMinor)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </section>
          </div>

          <aside className="h-fit rounded-[9px] bg-white p-[24px]">
            <h2 className="mb-4 text-[16px] font-semibold">Withdraw</h2>
            <WithdrawForm
              availableMinor={balance.availableMinor}
              minWithdrawalMinor={balance.minWithdrawalMinor}
              bankName={balance.bankName}
              bankAccountLast4={balance.bankAccountLast4}
            />
          </aside>
        </div>
      </div>
    </>
  )
}
