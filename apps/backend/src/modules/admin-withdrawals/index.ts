import { Elysia, t } from 'elysia'
import { optionalEnum } from '../../lib/schema.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const WITHDRAWAL_STATUSES = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'PAID',
] as const

/**
 * Includes the full bank account number — an admin needs it to make the
 * transfer. This is the only place it is ever returned, and it must not be
 * logged or forwarded anywhere else.
 */
const adminWithdrawal = t.Object({
  id: t.String(),
  amountMinor: t.Integer(),
  status: t.UnionEnum(WITHDRAWAL_STATUSES),
  bankName: t.String(),
  bankAccountName: t.String(),
  bankAccountNumber: t.String(),
  reviewNote: t.Union([t.String(), t.Null()]),
  reviewedBy: t.Union([t.String(), t.Null()]),
  reviewedAt: t.Union([t.Date(), t.Null()]),
  paymentRef: t.Union([t.String(), t.Null()]),
  paidAt: t.Union([t.Date(), t.Null()]),
  createdAt: t.Date(),
  brand: t.Object({ id: t.String(), name: t.String() }),
})

export const adminWithdrawalsModule = new Elysia({
  name: 'admin-withdrawals',
  prefix: '/admin/withdrawals',
})
  .use(requireAccess({ roles: ['ADMIN'] }))

  .get('/', ({ query }) => service.list({ status: query.status }), {
    query: t.Object({ status: optionalEnum(WITHDRAWAL_STATUSES) }),
    detail: {
      summary: 'Withdrawal queue',
      description:
        'Oldest first — this is a work queue, and the brand who has waited ' +
        'longest is paid first. Includes full bank details, which an admin ' +
        'needs to make the transfer.',
      tags: ['Admin · Withdrawals'],
    },
    response: { 200: t.Array(adminWithdrawal) },
  })

  .patch(
    '/:id/approve',
    ({ params, body, auth }) =>
      service.approve({
        adminId: auth.userId,
        withdrawalId: params.id,
        reviewNote: body?.reviewNote,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Optional(
        t.Object({ reviewNote: t.Optional(t.String({ maxLength: 1000 })) })
      ),
      detail: {
        summary: 'Approve a withdrawal',
        description:
          'Writes no ledger row: the amount already left the balance when the ' +
          'brand raised the request. Next step is to transfer the money and ' +
          'mark it paid.',
        tags: ['Admin · Withdrawals'],
      },
      response: { 200: adminWithdrawal },
    }
  )

  .patch(
    '/:id/reject',
    ({ params, body, auth }) =>
      service.reject({
        adminId: auth.userId,
        withdrawalId: params.id,
        reviewNote: body.reviewNote,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        reviewNote: t.String({ minLength: 1, maxLength: 1000 }),
      }),
      detail: {
        summary: 'Reject a withdrawal',
        description:
          'Returns the amount to the balance as a compensating ADJUSTMENT ' +
          'rather than deleting the original debit — the ledger is ' +
          'append-only, and the fact a request was made stays on the record. ' +
          'A reviewNote is required and is shown to the brand.',
        tags: ['Admin · Withdrawals'],
      },
      response: { 200: adminWithdrawal },
    }
  )

  .patch(
    '/:id/paid',
    ({ params, body, auth }) =>
      service.markPaid({
        adminId: auth.userId,
        withdrawalId: params.id,
        paymentRef: body.paymentRef,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        paymentRef: t.String({ minLength: 1, maxLength: 200 }),
      }),
      detail: {
        summary: 'Record the bank transfer',
        description:
          'Only an approved request can be marked paid — doing so to a ' +
          'rejected or already-paid one would double-count money that has ' +
          'left the platform.',
        tags: ['Admin · Withdrawals'],
      },
      response: { 200: adminWithdrawal },
    }
  )
