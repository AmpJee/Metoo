/**
 * Admin sales pipeline.
 *
 * The console tracks brands and retailers through outreach — Not Contacted,
 * Contacted, Interested, Onboarded, Declined — and the same field doubles as
 * the authorisation gate: only ONBOARDED accounts can trade.
 *
 * Two rules run through all of it:
 *
 *   1. Every status change writes an AuditLog row. "Who onboarded this brand,
 *      and when?" has to be answerable months later.
 *   2. Bank account numbers never leave this module. They are on BrandProfile
 *      for manual payouts and are admin-only PII — the selects below list
 *      fields explicitly rather than spreading the whole profile.
 */
import { TRADING_STATUS } from '@metoo/shared'
import type {
  FdaStatus,
  PaymentPreference,
  PaymentReliability,
  PipelineStatus,
  Prisma,
  Role,
  ShopType,
  SizeBand,
} from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { createDocumentReadUrl } from '../../lib/supabase.ts'
import { AppError } from '../../middleware/error.ts'

/** Explicit field lists, never `include: { brand: true }` — that would carry
 *  bankAccountNumber into a listing that does not need it. */
const applicantSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  reviewNote: true,
  createdAt: true,
  updatedAt: true,
  brand: {
    select: {
      id: true,
      name: true,
      phone: true,
      province: true,
      fdaStatus: true,
      sizeBand: true,
      socialHandle: true,
      caseWeightKg: true,
      caseDimensionsCm: true,
      caseUnits: true,
      existingRetailerCount: true,
      referralSource: true,
      adminNotes: true,
      _count: { select: { products: true } },
    },
  },
  retailer: {
    select: {
      id: true,
      shopName: true,
      phone: true,
      province: true,
      shopType: true,
      zone: true,
      socialHandle: true,
      currentProducts: true,
      monthlyCapacity: true,
      preferredPayment: true,
      paymentReliability: true,
      deliveryWindow: true,
      referralSource: true,
      adminNotes: true,
    },
  },
} satisfies Prisma.UserSelect

/**
 * Decimal does not survive JSON, so the case weight crosses the wire as a
 * number. Everything else passes through unchanged.
 *
 * Generic over the row so the other selected fields keep their types — a
 * concrete parameter type here would erase them from the return.
 */
function serialise<
  T extends { brand: { caseWeightKg: Prisma.Decimal | null } | null },
>(user: T) {
  return {
    ...user,
    brand: user.brand
      ? {
          ...user.brand,
          caseWeightKg: user.brand.caseWeightKg?.toNumber() ?? null,
        }
      : null,
  }
}

export async function listPipeline(filter: {
  status?: PipelineStatus
  role?: Role
}) {
  const users = await prisma.user.findMany({
    where: {
      // Admins are not in the pipeline — they are seeded, never prospected.
      role: filter.role ?? { in: ['BRAND', 'RETAILER'] },
      status: filter.status,
    },
    select: applicantSelect,
    orderBy: { createdAt: 'asc' },
  })

  return users.map(serialise)
}

/**
 * Verification documents for one applicant, each with a short-lived signed URL.
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
 * Move an account along the pipeline.
 *
 * DECLINED requires a note. Being turned down without a reason is the dead end
 * the product brief rules out, and the note is what the applicant is shown.
 */
export async function setPipelineStatus(params: {
  adminId: string
  userId: string
  status: PipelineStatus
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
      'Admin accounts are not part of the pipeline.'
    )
  }

  if (status === 'DECLINED' && !reviewNote?.trim()) {
    throw new AppError(
      422,
      'REVIEW_NOTE_REQUIRED',
      'A reviewNote is required when declining, so the applicant knows why.'
    )
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.user.update({
      where: { id: userId },
      data: {
        status,
        // Clearing the note on onboarding stops a stale rejection reason from
        // showing on an account that is now live.
        reviewNote: status === TRADING_STATUS ? null : reviewNote?.trim(),
      },
      select: applicantSelect,
    })

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: `PIPELINE_${status}`,
        entityType: 'User',
        entityId: userId,
        metadata: {
          from: user.status,
          to: status,
          reviewNote: reviewNote ?? null,
        },
      },
    })

    return row
  })

  return serialise(updated)
}

export interface BrandPipelineInput {
  fdaStatus?: FdaStatus
  sizeBand?: SizeBand
  socialHandle?: string
  caseWeightKg?: number
  caseDimensionsCm?: string
  caseUnits?: number
  existingRetailerCount?: number
  referralSource?: string
  adminNotes?: string
}

export interface RetailerPipelineInput {
  shopType?: ShopType
  zone?: string
  socialHandle?: string
  currentProducts?: string
  monthlyCapacity?: number
  preferredPayment?: PaymentPreference
  paymentReliability?: PaymentReliability
  deliveryWindow?: string
  referralSource?: string
  adminNotes?: string
}

/**
 * Update the outreach fields on a brand or retailer profile.
 *
 * Admin-only by route. These fields — notes especially — are internal and the
 * account holder never sees them.
 */
export async function updatePipelineFields(params: {
  adminId: string
  userId: string
  brand?: BrandPipelineInput
  retailer?: RetailerPipelineInput
}) {
  const { adminId, userId, brand, retailer } = params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      brand: { select: { id: true } },
      retailer: { select: { id: true } },
    },
  })

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', `No account with id ${userId}.`)
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (brand && user.brand) {
      await tx.brandProfile.update({
        where: { id: user.brand.id },
        data: brand,
      })
    }

    if (retailer && user.retailer) {
      await tx.retailerProfile.update({
        where: { id: user.retailer.id },
        data: retailer,
      })
    }

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: 'PIPELINE_FIELDS_UPDATED',
        entityType: 'User',
        entityId: userId,
        // The inputs are plain optional-property objects; Prisma's JSON input
        // type does not accept `undefined` members, so assert the shape.
        metadata: {
          brand: brand ?? null,
          retailer: retailer ?? null,
        } as Prisma.InputJsonValue,
      },
    })

    return tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: applicantSelect,
    })
  })

  return serialise(updated)
}
