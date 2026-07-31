/**
 * Admin approval use-cases.
 *
 * Two rules run through all of it:
 *
 *   1. Every decision writes an AuditLog row. "Who approved this brand, and
 *      when?" has to be answerable months later.
 *   2. Bank account numbers never leave this module. They are on BrandProfile
 *      for manual payouts and are admin-only PII — the selects below list
 *      fields explicitly rather than spreading the whole profile.
 */
import type {
  AccountStatus,
  Prisma,
  Role,
} from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { createDocumentReadUrl } from '../../lib/supabase.ts'
import { AppError } from '../../middleware/error.ts'

/** Explicit field lists, never `include: { brand: true }` — that would carry
 *  bankAccountNumber into an approvals listing that does not need it. */
const applicantSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  reviewNote: true,
  createdAt: true,
  updatedAt: true,
  brand: {
    select: { id: true, name: true, phone: true, province: true },
  },
  retailer: {
    select: { id: true, shopName: true, phone: true, province: true },
  },
} satisfies Prisma.UserSelect

export async function listApprovals(filter: {
  status?: AccountStatus
  role?: Role
}) {
  return prisma.user.findMany({
    where: {
      // Admins are not part of the approval queue — they are created by seed
      // or by another admin, never through signup.
      role: filter.role ?? { in: ['BRAND', 'RETAILER'] },
      status: filter.status,
    },
    select: applicantSelect,
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Documents for one applicant, each with a short-lived signed URL.
 *
 * The URLs are minted per request and expire in minutes, so this response must
 * not be cached or logged.
 */
export async function listApplicantDocuments(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      brand: { select: { id: true } },
      retailer: { select: { id: true } },
    },
  })

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', `No account with id ${userId}.`)
  }

  const documents = await prisma.verificationDocument.findMany({
    where: {
      OR: [
        { brandId: user.brand?.id ?? '__none__' },
        { retailerId: user.retailer?.id ?? '__none__' },
      ],
    },
    orderBy: { createdAt: 'asc' },
  })

  return Promise.all(
    documents.map(async (doc) => ({
      id: doc.id,
      type: doc.type,
      status: doc.status,
      reviewNote: doc.reviewNote,
      createdAt: doc.createdAt,
      url: await createDocumentReadUrl(doc.storageKey),
    }))
  )
}

/**
 * Record an admin decision.
 *
 * RESUBMIT_REQUIRED and REJECTED both demand a note. A rejection the applicant
 * cannot act on is the dead end the product brief explicitly rules out, and
 * RESUBMIT_REQUIRED is the state that keeps the loop open — REJECTED is
 * reserved for a final refusal.
 */
export async function decideApproval(params: {
  adminId: string
  userId: string
  status: Extract<AccountStatus, 'APPROVED' | 'REJECTED' | 'RESUBMIT_REQUIRED'>
  reviewNote?: string
}) {
  const { adminId, userId, status, reviewNote } = params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  })

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', `No account with id ${userId}.`)
  }

  if (user.role === 'ADMIN') {
    throw new AppError(
      422,
      'NOT_AN_APPLICANT',
      'Admin accounts do not go through approval.'
    )
  }

  if (status !== 'APPROVED' && !reviewNote?.trim()) {
    throw new AppError(
      422,
      'REVIEW_NOTE_REQUIRED',
      `A reviewNote is required when setting status to ${status}, so the applicant knows what to fix.`
    )
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        status,
        // Clearing the note on approval stops a stale rejection reason from
        // showing on an account that is now live.
        reviewNote: status === 'APPROVED' ? null : reviewNote?.trim(),
      },
      select: applicantSelect,
    })

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: `APPROVAL_${status}`,
        entityType: 'User',
        entityId: userId,
        metadata: {
          from: user.status,
          to: status,
          reviewNote: reviewNote ?? null,
        },
      },
    })

    return updated
  })
}
