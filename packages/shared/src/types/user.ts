import type { ACCOUNT_STATUSES, ROLES } from '../constants/roles.ts'

export type Role = (typeof ROLES)[number]

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

/**
 * SAMPLE — the API-facing shape of a user, mirroring the sample Prisma model.
 * Note it carries no password: this is what crosses the wire to the frontend.
 */
export interface User {
  id: string
  email: string
  name: string
  role: Role
  createdAt: string
  updatedAt: string
}
