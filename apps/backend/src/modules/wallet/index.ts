import { Elysia, t } from 'elysia'
import { brandIdForUser } from '../../lib/profile.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const withdrawal = t.Object({
  id: t.String(),
  amountMinor: t.Integer(),
  status: t.UnionEnum(['REQUESTED', 'APPROVED', 'REJECTED', 'PAID']),
  bankName: t.String(),
  bankAccountName: t.String(),
  reviewNote: t.Union([t.String(), t.Null()]),
  paymentRef: t.Union([t.String(), t.Null()]),
  paidAt: t.Union([t.Date(), t.Null()]),
  createdAt: t.Date(),
})

export const walletModule = new Elysia({ name: 'wallet', prefix: '/wallet' })
  .use(requireAccess({ roles: ['BRAND'], approved: true }))

  .get(
    '/',
    async ({ auth }) => service.summary(await brandIdForUser(auth.userId)),
    {
      detail: {
        summary: 'Wallet balance',
        description:
          'Available balance is the ledger sum. Pending clearance is the payout ' +
          'on delivered orders not yet confirmed as paid — released once they ' +
          'reach Money Received. The bank account shows its last four digits ' +
          'only.',
        tags: ['Brand · Wallet'],
      },
      response: {
        200: t.Object({
          availableMinor: t.Integer(),
          pendingClearanceMinor: t.Integer(),
          minWithdrawalMinor: t.Integer(),
          bankName: t.Union([t.String(), t.Null()]),
          bankAccountLast4: t.Union([t.String(), t.Null()]),
        }),
      },
    }
  )

  .get(
    '/transactions',
    async ({ auth, query }) =>
      service.transactions(
        await brandIdForUser(auth.userId),
        query.limit ?? 50
      ),
    {
      query: t.Object({
        limit: t.Optional(t.Integer({ minimum: 1, maximum: 200 })),
      }),
      detail: {
        summary: 'Ledger history',
        description:
          'Newest first. Amounts are signed — credits positive, debits ' +
          'negative — and each row carries the order or withdrawal it came ' +
          'from so the screen can label it without a second lookup.',
        tags: ['Brand · Wallet'],
      },
      response: {
        200: t.Array(
          t.Object({
            id: t.String(),
            type: t.UnionEnum([
              'SALE_CREDIT',
              'COMMISSION_DEBIT',
              'REFUND_DEBIT',
              'WITHDRAWAL_DEBIT',
              'ADJUSTMENT',
            ]),
            amountMinor: t.Integer(),
            note: t.Union([t.String(), t.Null()]),
            createdAt: t.Date(),
            order: t.Union([
              t.Object({ id: t.String(), orderNumber: t.String() }),
              t.Null(),
            ]),
            withdrawal: t.Union([
              t.Object({ id: t.String(), bankName: t.String() }),
              t.Null(),
            ]),
          })
        ),
      },
    }
  )

  .get(
    '/withdrawals',
    async ({ auth }) =>
      service.listWithdrawals(await brandIdForUser(auth.userId)),
    {
      detail: { summary: 'Withdrawal history', tags: ['Brand · Wallet'] },
      response: { 200: t.Array(withdrawal) },
    }
  )

  .post(
    '/withdrawals',
    async ({ auth, body, set }) => {
      set.status = 201
      return service.requestWithdrawal({
        brandId: await brandIdForUser(auth.userId),
        amountMinor: body.amountMinor,
      })
    },
    {
      body: t.Object({ amountMinor: t.Integer({ minimum: 1 }) }),
      detail: {
        summary: 'Request a withdrawal',
        description:
          'The balance is re-checked inside the same transaction that writes ' +
          'the debit, so concurrent requests cannot overdraw the wallet. The ' +
          'amount leaves the balance immediately, before admin approval — ' +
          'otherwise several pending requests could each pass on their own ' +
          'and together exceed what is there. An admin then transfers by bank ' +
          'and marks it paid.',
        tags: ['Brand · Wallet'],
      },
      response: { 201: withdrawal },
    }
  )
