/**
 * SAMPLE — the three account roles from the product brief.
 *
 * Values must stay identical to the `Role` enum in
 * `apps/backend/prisma/schema.prisma`; Prisma enums are strings on the wire.
 */
export const ROLES = ['ADMIN', 'BRAND', 'RETAILER'] as const

/**
 * SAMPLE — brand and retailer signups need manual admin approval before the
 * account goes live. Rejection loops back to a resubmit state, never a dead end.
 */
export const ACCOUNT_STATUSES = ['PENDING', 'ACTIVE', 'REJECTED'] as const
