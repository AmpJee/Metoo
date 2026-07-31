/**
 * Feedback, and the admin log that reads it.
 *
 * Anyone signed in can leave it, including accounts still in the pipeline —
 * someone stuck in onboarding is exactly who most needs a way to say so.
 */
import type { FeedbackStatus, Role } from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../middleware/error.ts'

const feedbackSelect = {
  id: true,
  authorRole: true,
  authorLabel: true,
  message: true,
  status: true,
  adminNote: true,
  resolvedAt: true,
  createdAt: true,
}

/**
 * A human label for whoever is writing.
 *
 * Snapshotted onto the row rather than joined at read time, so the log stays
 * readable after an account is deleted — which is when old feedback tends to
 * matter most.
 */
async function authorLabel(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      brand: { select: { name: true } },
      retailer: { select: { shopName: true } },
    },
  })

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'This account no longer exists.')
  }

  return user.brand?.name ?? user.retailer?.shopName ?? user.email
}

export async function submit(params: {
  userId: string
  role: Role
  message: string
}) {
  const { userId, role, message } = params

  return prisma.feedback.create({
    data: {
      authorId: userId,
      authorRole: role,
      authorLabel: await authorLabel(userId),
      message: message.trim(),
    },
    select: feedbackSelect,
  })
}

/** What this account has sent, so it can see it was received. */
export function listOwn(userId: string) {
  return prisma.feedback.findMany({
    where: { authorId: userId },
    select: feedbackSelect,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * The admin log.
 *
 * Open first, newest within that — it is a queue, and an unread item matters
 * more than a recent one.
 */
export function listAll(filter: { status?: FeedbackStatus }) {
  return prisma.feedback.findMany({
    where: { status: filter.status },
    select: feedbackSelect,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function resolve(params: {
  adminId: string
  feedbackId: string
  adminNote?: string
}) {
  const existing = await prisma.feedback.findUnique({
    where: { id: params.feedbackId },
    select: { id: true, status: true },
  })

  if (!existing) {
    throw new AppError(404, 'FEEDBACK_NOT_FOUND', 'No such feedback.')
  }

  if (existing.status === 'RESOLVED') {
    throw new AppError(
      422,
      'FEEDBACK_ALREADY_RESOLVED',
      'This feedback has already been resolved.'
    )
  }

  return prisma.feedback.update({
    where: { id: existing.id },
    data: {
      status: 'RESOLVED',
      adminNote: params.adminNote?.trim() ?? null,
      resolvedBy: params.adminId,
      resolvedAt: new Date(),
    },
    select: feedbackSelect,
  })
}
