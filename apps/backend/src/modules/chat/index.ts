import { Elysia, t } from 'elysia'
import { TRADING_STATUS } from '@metoo/shared'
import { MAX_MESSAGE_LENGTH } from '../../domain/chat.ts'
import { profileIdsForUser, retailerIdForUser } from '../../lib/profile.ts'
import type { AuthContext } from '../../middleware/auth.ts'
import { requireAuth } from '../../middleware/auth.ts'
import { AppError } from '../../middleware/error.ts'
import * as service from './service.ts'
import type { Viewer } from './service.ts'

const message = t.Object({
  id: t.String(),
  senderId: t.String(),
  body: t.String(),
  /** Null until the other side opens the thread. */
  readAt: t.Union([t.Date(), t.Null()]),
  createdAt: t.Date(),
})

const thread = t.Object({
  id: t.String(),
  /**
   * The other side, whoever that is for you — a retailer sees the brand, a
   * brand sees the shop. Neither is shown itself.
   */
  counterparty: t.Object({
    id: t.String(),
    name: t.String(),
    logoUrl: t.Union([t.String(), t.Null()]),
  }),
  lastMessage: t.Union([message, t.Null()]),
  unreadCount: t.Integer(),
  lastMessageAt: t.Date(),
  createdAt: t.Date(),
})

/**
 * Both roles use these routes, so the guard is `requireAuth` plus a viewer
 * resolved per request. An admin authenticates fine and simply participates in
 * no threads — `isParticipant` returns false for someone holding neither
 * profile, so every thread reads as 404 to them.
 */
async function viewerFor(userId: string): Promise<Viewer> {
  return { userId, ...(await profileIdsForUser(userId)) }
}

/**
 * Starting a conversation is retailer-only, checked here rather than by a
 * second Elysia instance with its own guard.
 *
 * A separate module prefixed `/chat/threads` shadowed this one's
 * `GET /chat/threads` — both claimed the same path, and the GET became
 * unreachable for every role even though /openapi still listed it. One module
 * owns the prefix; the one route that needs a stricter rule states it inline.
 */
function assertMayStartThread(auth: AuthContext) {
  if (auth.role !== 'RETAILER') {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Only a retailer can start a conversation. A brand replies to threads it is already in.'
    )
  }

  if (auth.status !== TRADING_STATUS) {
    throw new AppError(
      403,
      'ACCOUNT_NOT_ONBOARDED',
      'Your onboarding is in progress. We will be in touch shortly.'
    )
  }
}

export const chatModule = new Elysia({ name: 'chat', prefix: '/chat' })
  .use(requireAuth)

  .get(
    '/threads',
    async ({ auth }) => service.listThreads(await viewerFor(auth.userId)),
    {
      detail: {
        summary: 'Your conversations',
        description:
          'Most recently active first, each with the other party, a one-line ' +
          'preview and an unread count. Sorted on the thread’s own ' +
          'lastMessageAt, so listing does not read the message history.',
        tags: ['Chat'],
      },
      response: { 200: t.Array(thread) },
    }
  )

  .get(
    '/unread-count',
    async ({ auth }) => service.unreadCount(await viewerFor(auth.userId)),
    {
      detail: {
        summary: 'Unread messages across every thread',
        description: 'One number for the nav badge. Cheap enough to poll.',
        tags: ['Chat'],
      },
      response: { 200: t.Object({ unreadCount: t.Integer() }) },
    }
  )

  .get(
    '/threads/:id/messages',
    async ({ auth, params, query }) =>
      service.listMessages({
        threadId: params.id,
        viewer: await viewerFor(auth.userId),
        limit: query.limit ?? 50,
        cursor: query.cursor,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      query: t.Object({
        cursor: t.Optional(t.String()),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
      }),
      detail: {
        summary: 'Messages in a thread',
        description:
          'Oldest first — a conversation reads top to bottom. Cursor ' +
          'paginated. A thread you are not part of returns 404, not 403, so ' +
          'the endpoint cannot confirm that someone else’s conversation exists.',
        tags: ['Chat'],
      },
      response: {
        200: t.Object({
          items: t.Array(message),
          nextCursor: t.Union([t.String(), t.Null()]),
        }),
      },
    }
  )

  .post(
    '/threads/:id/messages',
    async ({ auth, params, body, set }) => {
      set.status = 201
      return service.sendMessage({
        threadId: params.id,
        body: body.body,
        viewer: await viewerFor(auth.userId),
      })
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({ body: t.String({ maxLength: MAX_MESSAGE_LENGTH }) }),
      detail: {
        summary: 'Send a message',
        description:
          'Either side may reply once a thread exists. The body is trimmed ' +
          'before storing, and whitespace alone is rejected rather than sent ' +
          'as a blank bubble.',
        tags: ['Chat'],
      },
      response: { 201: message },
    }
  )

  .patch(
    '/threads/:id/read',
    async ({ auth, params }) =>
      service.markRead(params.id, await viewerFor(auth.userId)),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Mark the other side’s messages as read',
        description:
          'Only messages you did not send, and only ones still unread — ' +
          'readAt is a timestamp, so re-marking would move it and make "when ' +
          'did they see this" untrue.',
        tags: ['Chat'],
      },
      response: { 200: t.Object({ markedRead: t.Integer() }) },
    }
  )

  .post(
    '/threads',
    async ({ auth, body, set }) => {
      assertMayStartThread(auth)
      set.status = 201

      return service.startThread({
        retailerId: await retailerIdForUser(auth.userId),
        brandId: body.brandId,
        message: body.message,
        senderUserId: auth.userId,
      })
    },
    {
      body: t.Object({
        brandId: t.String({ format: 'uuid' }),
        message: t.String({ maxLength: MAX_MESSAGE_LENGTH }),
      }),
      detail: {
        summary: 'Start a conversation with a brand',
        description:
          'Retailer only — the design’s entry point is "Chat With Seller" on ' +
          'the product page, and there is no seller-side equivalent: a brand ' +
          'replies to threads, it does not open them. That is also what keeps ' +
          'this a support channel rather than an outbound marketing one. ' +
          'Idempotent: you get the existing thread if there is one, so tapping ' +
          'the button twice cannot split the history in two.',
        tags: ['Chat'],
      },
      response: { 201: t.Object({ id: t.String() }) },
    }
  )
