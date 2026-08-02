import { Elysia, t } from 'elysia'
import { ROLES } from '@metoo/shared'
import { optionalEnum } from '../../lib/schema.ts'
import { requireAccess, requireAuth } from '../../middleware/auth.ts'
import * as service from './service.ts'

const FEEDBACK_STATUSES = ['OPEN', 'RESOLVED'] as const

const feedback = t.Object({
  id: t.String(),
  authorRole: t.UnionEnum(ROLES),
  /** Brand name, shop name, or email — snapshotted when it was written. */
  authorLabel: t.String(),
  message: t.String(),
  status: t.UnionEnum(FEEDBACK_STATUSES),
  adminNote: t.Union([t.String(), t.Null()]),
  resolvedAt: t.Union([t.Date(), t.Null()]),
  createdAt: t.Date(),
})

/**
 * Anyone signed in can leave feedback — `requireAuth`, not `requireAccess`
 * with a role or onboarding gate. An account stuck in the pipeline is exactly
 * the one that most needs a way to say so.
 */
export const feedbackModule = new Elysia({
  name: 'feedback',
  prefix: '/feedback',
})
  .use(requireAuth)

  .get('/', ({ auth }) => service.listOwn(auth.userId), {
    detail: {
      summary: 'Feedback you have sent',
      description: 'So you can see it was received, and any reply.',
      tags: ['Feedback'],
    },
    response: { 200: t.Array(feedback) },
  })

  .post(
    '/',
    async ({ auth, body, set }) => {
      set.status = 201
      return service.submit({
        userId: auth.userId,
        role: auth.role,
        message: body.message,
      })
    },
    {
      body: t.Object({ message: t.String({ minLength: 1, maxLength: 5000 }) }),
      detail: {
        summary: 'Send feedback',
        description:
          'No category or subject. The design’s Feedback Log is a general ' +
          'channel, and making someone classify a problem before reporting it ' +
          'is how you stop them reporting it.',
        tags: ['Feedback'],
      },
      response: { 201: feedback },
    }
  )

/** The admin Feedback Log. */
export const adminFeedbackModule = new Elysia({
  name: 'admin-feedback',
  prefix: '/admin/feedback',
})
  .use(requireAccess({ roles: ['ADMIN'] }))

  .get('/', ({ query }) => service.listAll({ status: query.status }), {
    query: t.Object({ status: optionalEnum(FEEDBACK_STATUSES) }),
    detail: {
      summary: 'Every piece of feedback',
      description:
        'Open first, newest within that — an unread item matters more than a ' +
        'recent one.',
      tags: ['Admin · Feedback'],
    },
    response: { 200: t.Array(feedback) },
  })

  .patch(
    '/:id',
    ({ params, body, auth }) =>
      service.updateEntry({
        adminId: auth.userId,
        feedbackId: params.id,
        adminNote: body.adminNote,
        status: body.status,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object(
        {
          adminNote: t.Optional(
            t.Union([t.String({ maxLength: 2000 }), t.Null()])
          ),
          // optionalEnum, NOT t.Optional(t.UnionEnum(...)). The latter emits
          // `default: "OPEN"` and Elysia applies it to an absent property, so
          // editing only the note silently reopened a resolved entry — and
          // filled the body, defeating minProperties as well.
          status: optionalEnum(FEEDBACK_STATUSES),
        },
        { minProperties: 1 }
      ),
      detail: {
        summary: 'Edit a feedback entry',
        description:
          'For fixing a note or reopening something that came back. Separate ' +
          'from /resolve, which is the one-way "dealt with" action — folding ' +
          'them together would make re-resolving the only way to correct a ' +
          'typo. Setting status back to OPEN clears resolvedBy and resolvedAt ' +
          'rather than leaving a timestamp claiming someone closed a thing ' +
          'that is open again. ' +
          'The message itself is not editable: it is what the author wrote, ' +
          'and an admin rewriting it would make this a log of admin opinion ' +
          'rather than of feedback.',
        tags: ['Admin · Feedback'],
      },
      response: { 200: feedback },
    }
  )

  .patch(
    '/:id/resolve',
    ({ params, body, auth }) =>
      service.resolve({
        adminId: auth.userId,
        feedbackId: params.id,
        adminNote: body?.adminNote,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Optional(
        t.Object({ adminNote: t.Optional(t.String({ maxLength: 2000 })) })
      ),
      detail: {
        summary: 'Resolve a piece of feedback',
        description:
          'The note is shown to whoever sent it. Resolving twice returns 422 ' +
          'rather than silently overwriting the first resolution.',
        tags: ['Admin · Feedback'],
      },
      response: { 200: feedback },
    }
  )
