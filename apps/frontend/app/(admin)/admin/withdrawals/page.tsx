import { WITHDRAWAL_STATUS_LABELS } from '@metoo/shared'
import { Banknote } from 'lucide-react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard-shell'
import { Pill } from '@/components/console/pill'
import { Card, CardEmpty } from '@/components/console/card'
import { StatTile } from '@/components/console/stat-tile'
import { Table, TBody, TD, TH, THead, TR } from '@/components/console/table'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import type { AdminWithdrawal, WithdrawalStatus } from '@/lib/types'
import { WithdrawalActions } from './withdrawal-actions'

export const metadata: Metadata = { title: 'Withdrawals' }

const TONE: Record<
  WithdrawalStatus,
  'warning' | 'info' | 'success' | 'danger'
> = {
  REQUESTED: 'warning',
  APPROVED: 'info',
  PAID: 'success',
  REJECTED: 'danger',
}

/**
 * Brand payouts.
 *
 * There is no Stripe Connect — payouts are a wallet ledger plus a manual bank
 * transfer, so this screen is where the money actually moves. The full
 * account number is shown because an operator needs it to make the transfer;
 * it is admin-only PII and must not leak anywhere else.
 */
export default async function AdminWithdrawalsPage() {
  const withdrawals = await api.get<AdminWithdrawal[]>('/admin/withdrawals')

  const awaiting = withdrawals.filter((row) => row.status === 'REQUESTED')
  const approved = withdrawals.filter((row) => row.status === 'APPROVED')
  const owed = [...awaiting, ...approved].reduce(
    (sum, row) => sum + row.amountMinor,
    0
  )

  return (
    <>
      <PageHeader
        title="Withdrawals"
        description="Approve a request, transfer the money, then record the reference."
      />

      <div className="flex flex-col gap-[20px]">
        <section className="grid gap-4 sm:grid-cols-3">
          <StatTile
            label="Awaiting review"
            value={String(awaiting.length)}
            tint="warning"
          />
          <StatTile
            label="Approved, not yet paid"
            value={String(approved.length)}
          />
          <StatTile
            label="Total outstanding"
            value={formatBaht(owed)}
            tint="primary"
          />
        </section>

        <Card>
          {withdrawals.length === 0 ? (
            <CardEmpty
              icon={Banknote}
              title="No withdrawal requests"
              description="Brands request payouts from their wallet."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Requested</TH>
                  <TH>Brand</TH>
                  <TH>Transfer to</TH>
                  <TH className="text-right">Amount</TH>
                  <TH>Status</TH>
                  <TH>Action</TH>
                </TR>
              </THead>
              <TBody>
                {withdrawals.map((row) => (
                  <TR key={row.id}>
                    <TD className="whitespace-nowrap text-black/50">
                      {formatDate(row.createdAt)}
                    </TD>
                    <TD className="font-bold">{row.brand.name}</TD>
                    <TD>
                      {row.bankName}
                      <span className="block text-[13px] text-black/50">
                        {row.bankAccountName}
                      </span>
                      <span className="block font-mono text-[13px]">
                        {row.bankAccountNumber}
                      </span>
                    </TD>
                    <TD numeric className="font-bold">
                      {formatBaht(row.amountMinor)}
                    </TD>
                    <TD>
                      <Pill tone={TONE[row.status]}>
                        {WITHDRAWAL_STATUS_LABELS[row.status]}
                      </Pill>
                      {row.reviewNote ? (
                        <span className="mt-1 block max-w-[200px] text-[13px] text-black/50">
                          {row.reviewNote}
                        </span>
                      ) : null}
                      {row.paymentRef ? (
                        <span className="mt-1 block text-[13px] text-black/50">
                          Ref {row.paymentRef}
                        </span>
                      ) : null}
                    </TD>
                    <TD>
                      <WithdrawalActions id={row.id} status={row.status} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  )
}
