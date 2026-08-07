import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/dashboard-shell'
import { Pill } from '@/components/console/pill'
import { StatTile } from '@/components/console/stat-tile'
import { Table, TBody, TD, TH, THead, TR } from '@/components/console/table'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import type {
  WalletBalance,
  WalletTransaction,
  Withdrawal,
  WithdrawalStatus,
} from '@/lib/types'
import { WithdrawForm } from './withdraw-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('wallet.title') }
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
  const t = await getT()
  const locale = await getLocale()
  const [balance, transactions, withdrawals] = await Promise.all([
    api.get<WalletBalance>('/wallet'),
    api.get<WalletTransaction[]>('/wallet/transactions'),
    api.get<Withdrawal[]>('/wallet/withdrawals'),
  ])

  return (
    <>
      <PageHeader
        title={t('wallet.title')}
        description={t('wallet.subtitle')}
      />

      <div className="flex flex-col gap-[20px]">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatTile
            label={t('wallet.available')}
            value={formatBaht(balance.availableMinor)}
            tint="primary"
          />
          <StatTile
            label={t('wallet.pending')}
            value={formatBaht(balance.pendingClearanceMinor)}
            hint={t('wallet.pendingHint')}
          />
          <StatTile
            label={t('wallet.bankAccount')}
            value={
              balance.bankAccountLast4
                ? `····${balance.bankAccountLast4}`
                : t('wallet.bankNotSet')
            }
            hint={balance.bankName ?? t('wallet.bankAddHint')}
          />
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <h2 className="text-[16px] font-semibold">
                {t('wallet.ledger')}
              </h2>
              {transactions.length === 0 ? (
                <p className="rounded-[9px] bg-white px-4 py-8 text-center text-[15px] text-black/50">
                  {t('wallet.ledgerEmpty')}
                </p>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>{t('wallet.date')}</TH>
                      <TH>{t('wallet.type')}</TH>
                      <TH>{t('wallet.reference')}</TH>
                      <TH className="text-right">{t('wallet.amount')}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {transactions.map((txn) => (
                      <TR key={txn.id}>
                        <TD className="whitespace-nowrap text-black/50">
                          {formatDate(txn.createdAt, locale)}
                        </TD>
                        <TD>{t(`txn.${txn.type}`)}</TD>
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
              <h2 className="text-[16px] font-semibold">
                {t('wallet.withdrawals')}
              </h2>
              {withdrawals.length === 0 ? (
                <p className="rounded-[9px] bg-white px-4 py-8 text-center text-[15px] text-black/50">
                  {t('wallet.withdrawalsEmpty')}
                </p>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>{t('wallet.requested')}</TH>
                      <TH>{t('wallet.to')}</TH>
                      <TH>{t('wallet.status')}</TH>
                      <TH className="text-right">{t('wallet.amount')}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {withdrawals.map((item) => (
                      <TR key={item.id}>
                        <TD className="whitespace-nowrap text-black/50">
                          {formatDate(item.createdAt, locale)}
                        </TD>
                        <TD>
                          {item.bankName}
                          <span className="block text-[13px] text-black/50">
                            {item.bankAccountName}
                          </span>
                        </TD>
                        <TD>
                          <Pill tone={WITHDRAWAL_TONE[item.status]}>
                            {t(`withdrawal.${item.status}`)}
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
            <h2 className="mb-4 text-[16px] font-semibold">
              {t('wallet.withdraw')}
            </h2>
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
