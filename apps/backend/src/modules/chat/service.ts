/**
 * Retailer ↔ brand chat.
 *
 * Polling, not websockets: the design's chat is a support channel between two
 * businesses during working hours, not a live conversation. Polling costs one
 * indexed query and removes an entire class of connection-lifecycle bugs, and
 * `lastMessageAt` on the thread means the list sorts without touching messages.
 *
 * Threads are started by the retailer only. The design's entry point is a
 * "Chat With Seller" button on the product page, and there is no equivalent on
 * the seller side — a brand replies to threads, it does not open them. That is
 * also the difference between a support channel and an outbound marketing one.
 */
import { prisma } from '../../config/prisma.ts'
import { checkMessage, isParticipant } from '../../domain/chat.ts'
import { AppError } from '../../middleware/error.ts'

/** The viewer's own profile ids, resolved once per request. */
export interface Viewer {
  userId: string
  retailerId?: string | null
  brandId?: string | null
}

const messageSelect = {
  id: true,
  senderId: true,
  body: true,
  readAt: true,
  createdAt: true,
}

/**
 * Load a thread and prove the viewer belongs to it.
 *
 * 404 rather than 403 for a thread that exists but is not theirs — a 403 would
 * confirm the id is real, which is enough to probe for other people's
 * conversations.
 */
async function participatingThread(threadId: string, viewer: Viewer) {
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    select: { id: true, retailerId: true, brandId: true },
  })

  if (!thread || !isParticipant(thread, viewer)) {
    throw new AppError(404, 'THREAD_NOT_FOUND', 'No such conversation.')
  }

  return thread
}

function assertMessage(raw: string) {
  const result = checkMessage(raw)

  if (!result.ok) {
    throw new AppError(
      422,
      result.code,
      result.code === 'MESSAGE_EMPTY'
        ? 'A message needs some text in it.'
        : 'That message is too long.'
    )
  }

  return result.body
}

/**
 * Open a conversation with a brand, or reuse the existing one.
 *
 * Idempotent by design: tapping "Chat With Seller" twice, or from two
 * different products by the same brand, must land in one thread rather than
 * splitting the history. The unique key on (retailerId, brandId) is what makes
 * that true even under a double-tap.
 */
export async function startThread(params: {
  retailerId: string
  brandId: string
  message: string
  senderUserId: string
}) {
  const body = assertMessage(params.message)

  const brand = await prisma.brandProfile.findFirst({
    where: { id: params.brandId, user: { status: 'ONBOARDED' } },
    select: { id: true },
  })

  if (!brand) {
    throw new AppError(404, 'BRAND_NOT_FOUND', 'No such brand.')
  }

  const thread = await prisma.chatThread.upsert({
    where: {
      retailerId_brandId: {
        retailerId: params.retailerId,
        brandId: params.brandId,
      },
    },
    update: {},
    create: { retailerId: params.retailerId, brandId: params.brandId },
    select: { id: true },
  })

  await sendMessage({
    threadId: thread.id,
    body,
    viewer: { userId: params.senderUserId, retailerId: params.retailerId },
  })

  return thread
}

/**
 * Append a message and bump the thread.
 *
 * One transaction: `lastMessageAt` is denormalised so the thread list can sort
 * without reading messages, which makes it a second copy of a fact. If the
 * bump could fail on its own, a thread would sit stale at the bottom of the
 * list with unread messages in it.
 */
export async function sendMessage(params: {
  threadId: string
  body: string
  viewer: Viewer
}) {
  const thread = await participatingThread(params.threadId, params.viewer)
  const body = assertMessage(params.body)

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { threadId: thread.id, senderId: params.viewer.userId, body },
      select: messageSelect,
    }),
    prisma.chatThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    }),
  ])

  return message
}

/**
 * Every conversation this account is in, most recent first.
 *
 * Counterparty naming is asymmetric on purpose: a retailer sees the brand's
 * name and logo, a brand sees the shop's name. Each side wants to know who
 * they are talking to, and neither wants to see itself.
 */
export async function listThreads(viewer: Viewer) {
  const threads = await prisma.chatThread.findMany({
    where: viewer.retailerId
      ? { retailerId: viewer.retailerId }
      : { brandId: viewer.brandId! },
    orderBy: { lastMessageAt: 'desc' },
    select: {
      id: true,
      lastMessageAt: true,
      createdAt: true,
      retailer: { select: { id: true, shopName: true } },
      brand: { select: { id: true, name: true, logoUrl: true } },
      // The preview line. One row per thread, not the whole history.
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: messageSelect,
      },
      // Unread means "sent by the other side and not yet read". Counted by
      // the database rather than by loading messages to count them here.
      _count: {
        select: {
          messages: {
            where: { readAt: null, senderId: { not: viewer.userId } },
          },
        },
      },
    },
  })

  return threads.map((thread) => ({
    id: thread.id,
    lastMessageAt: thread.lastMessageAt,
    createdAt: thread.createdAt,
    counterparty: viewer.retailerId
      ? {
          id: thread.brand.id,
          name: thread.brand.name,
          logoUrl: thread.brand.logoUrl,
        }
      : {
          id: thread.retailer.id,
          name: thread.retailer.shopName,
          logoUrl: null,
        },
    lastMessage: thread.messages[0] ?? null,
    unreadCount: thread._count.messages,
  }))
}

/** Oldest first — a conversation reads top to bottom. */
export async function listMessages(params: {
  threadId: string
  viewer: Viewer
  limit: number
  cursor?: string
}) {
  const thread = await participatingThread(params.threadId, params.viewer)

  const items = await prisma.message.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: 'asc' },
    select: messageSelect,
    // One extra to detect another page without a second count query.
    take: params.limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  })

  const hasMore = items.length > params.limit
  const page = hasMore ? items.slice(0, params.limit) : items

  return { items: page, nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null }
}

/**
 * Mark the other side's messages as read.
 *
 * Only theirs, and only unread ones — `readAt` is a timestamp, so re-marking
 * an already-read message would move it and make "when did they see this"
 * a lie.
 */
export async function markRead(threadId: string, viewer: Viewer) {
  const thread = await participatingThread(threadId, viewer)

  const { count } = await prisma.message.updateMany({
    where: {
      threadId: thread.id,
      senderId: { not: viewer.userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  return { markedRead: count }
}

/** One number for the nav badge, across every thread. */
export async function unreadCount(viewer: Viewer) {
  const count = await prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: viewer.userId },
      thread: viewer.retailerId
        ? { retailerId: viewer.retailerId }
        : { brandId: viewer.brandId! },
    },
  })

  return { unreadCount: count }
}
