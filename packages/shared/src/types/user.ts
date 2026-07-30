import type {
  CATEGORIES,
  FDA_STATUSES,
  ORDER_STATUSES,
  PAYMENT_PREFERENCES,
  PAYMENT_RELIABILITIES,
  PIPELINE_STATUSES,
  ROLES,
  SHOP_TYPES,
  SIZE_BANDS,
} from '../constants/roles.ts'

export type Role = (typeof ROLES)[number]

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number]

export type Category = (typeof CATEGORIES)[number]

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type FdaStatus = (typeof FDA_STATUSES)[number]

export type SizeBand = (typeof SIZE_BANDS)[number]

export type ShopType = (typeof SHOP_TYPES)[number]

export type PaymentPreference = (typeof PAYMENT_PREFERENCES)[number]

export type PaymentReliability = (typeof PAYMENT_RELIABILITIES)[number]

/**
 * The API-facing shape of a user.
 *
 * Note what is absent: `passwordHash`. This type is what crosses the wire to
 * the frontend, and the hash must never be part of that.
 */
export interface User {
  id: string
  email: string
  role: Role
  status: PipelineStatus
  createdAt: string
  updatedAt: string
}
