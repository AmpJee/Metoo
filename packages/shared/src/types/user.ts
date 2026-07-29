import type {
  ACCOUNT_STATUSES,
  CATEGORIES,
  ORDER_STATUSES,
  ROLES,
} from '../constants/roles.ts'

export type Role = (typeof ROLES)[number]

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export type Category = (typeof CATEGORIES)[number]

export type OrderStatus = (typeof ORDER_STATUSES)[number]

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
  status: AccountStatus
  createdAt: string
  updatedAt: string
}
