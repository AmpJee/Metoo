/**
 * Admin routes — the signup approval queue.
 *
 * Every route here is admin-only. Note `approved` is deliberately not set:
 * admins are seeded rather than approved, so gating them on the approval flow
 * they themselves operate would be circular.
 */
import { Elysia, t } from 'elysia'
import { ACCOUNT_STATUSES, ROLES } from '@metoo/shared'
import { optionalEnum } from '../../lib/schema.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const applicant = t.Object({
  id: t.String(),
  email: t.String(),
  role: t.UnionEnum(ROLES),
  status: t.UnionEnum(ACCOUNT_STATUSES),
  reviewNote: t.Union([t.String(), t.Null()]),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  brand: t.Union([
    t.Object({
      id: t.String(),
      name: t.String(),
      phone: t.String(),
      province: t.String(),
    }),
    t.Null(),
  ]),
  retailer: t.Union([
    t.Object({
      id: t.String(),
      shopName: t.String(),
      phone: t.String(),
      province: t.String(),
    }),
    t.Null(),
  ]),
})

export const adminModule = new Elysia({ name: 'admin', prefix: '/admin' })
  .use(requireAccess({ roles: ['ADMIN'] }))

  .get(
    '/approvals',
    ({ query }) =>
      service.listApprovals({ status: query.status, role: query.role }),
    {
      query: t.Object({
        // optionalEnum, not t.Optional(t.UnionEnum(...)) — the latter would
        // default an unfiltered request to status PENDING and role BRAND,
        // hiding every other applicant. See lib/schema.ts.
        status: optionalEnum(ACCOUNT_STATUSES),
        role: optionalEnum(['BRAND', 'RETAILER'] as const),
      }),
      detail: {
        summary: 'List signup applications',
        description:
          'Brands and retailers only; admin accounts are never in this queue. ' +
          'Filter by status to get the pending ones.',
        tags: ['Admin'],
      },
      response: { 200: t.Array(applicant) },
    }
  )

  .get(
    '/approvals/:userId/documents',
    ({ params }) => service.listApplicantDocuments(params.userId),
    {
      params: t.Object({ userId: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Verification documents for one applicant',
        description:
          'Each URL is a signed link into the private bucket and expires in ' +
          'five minutes. Do not cache or log this response. A brand needs an ' +
          'SME or National ID plus an อย. (FDA) certificate.',
        tags: ['Admin'],
      },
      response: {
        200: t.Array(
          t.Object({
            id: t.String(),
            type: t.UnionEnum(['SME_ID', 'NATIONAL_ID', 'FDA_CERT']),
            status: t.UnionEnum(['PENDING', 'APPROVED', 'REJECTED']),
            reviewNote: t.Union([t.String(), t.Null()]),
            createdAt: t.Date(),
            url: t.String(),
          })
        ),
      },
    }
  )

  .patch(
    '/approvals/:userId',
    ({ params, body, auth }) =>
      service.decideApproval({
        adminId: auth.userId,
        userId: params.userId,
        status: body.status,
        reviewNote: body.reviewNote,
      }),
    {
      params: t.Object({ userId: t.String({ format: 'uuid' }) }),
      body: t.Object({
        status: t.UnionEnum(['APPROVED', 'REJECTED', 'RESUBMIT_REQUIRED']),
        reviewNote: t.Optional(t.String({ maxLength: 1000 })),
      }),
      detail: {
        summary: 'Approve, reject, or request resubmission',
        description:
          'RESUBMIT_REQUIRED sends the applicant back to fix their documents ' +
          'and is the normal rejection path; REJECTED is a final refusal. ' +
          'Both require a reviewNote. Every decision writes an audit log entry.',
        tags: ['Admin'],
      },
      response: { 200: applicant },
    }
  )
