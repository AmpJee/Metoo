/**
 * Authentication and role-based access control.
 *
 * One guard factory rather than three composable ones. Elysia resolves
 * `derive` per instance, so chaining `.use(requireAuth).use(requireRole(...))`
 * both types `auth` as possibly-undefined downstream and verifies the token
 * twice. Doing every check in a single derive avoids both.
 *
 * Role and approval stay independent options because they answer different
 * questions. A PENDING brand *is* authenticated and *is* a brand — it simply
 * must not reach product management yet, while still being able to load the
 * screen that explains why.
 *
 *   .use(requireAccess({ roles: ['ADMIN'] }))
 *   .use(requireAccess({ roles: ['BRAND'], approved: true }))
 *   .use(requireAuth)   // any signed-in account
 */
import { Elysia } from 'elysia'
import type { AccountStatus, Role } from '@metoo/shared'
import { verifyAccessToken } from '../lib/jwt.ts'
import { AppError } from './error.ts'

export interface AuthContext {
  userId: string
  role: Role
  status: AccountStatus
}

export interface AccessOptions {
  /** Allowed roles. Omit to accept any authenticated account. */
  roles?: Role[]
  /** Require the account to have cleared admin approval. */
  approved?: boolean
}

function bearerToken(header: string | undefined): string | null {
  if (!header) return null

  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null

  return token
}

/**
 * The three non-approved states get distinct error codes so the frontend can
 * route to the right screen — waiting, fix-your-documents, or finally refused
 * — instead of showing one generic "forbidden".
 */
const BLOCKED: Record<Exclude<AccountStatus, 'APPROVED'>, [string, string]> = {
  PENDING: ['ACCOUNT_PENDING', 'Your account is awaiting admin approval.'],
  RESUBMIT_REQUIRED: [
    'ACCOUNT_RESUBMIT_REQUIRED',
    'Your documents need to be corrected and resubmitted.',
  ],
  REJECTED: ['ACCOUNT_REJECTED', 'Your account application was refused.'],
}

export function requireAccess(options: AccessOptions = {}) {
  const { roles, approved = false } = options

  // A stable, distinct name per option set: Elysia deduplicates instances by
  // name, so reusing one would silently apply the first guard's rules to a
  // module that asked for different ones.
  const name = `require-access:${roles?.join('|') ?? 'any'}:${approved}`

  return new Elysia({ name })
    .derive({ as: 'scoped' }, async ({ headers }) => {
      const token = bearerToken(headers.authorization)
      if (!token) {
        throw new AppError(
          401,
          'UNAUTHENTICATED',
          'Missing or malformed Authorization header. Expected: Bearer <token>.'
        )
      }

      const claims = await verifyAccessToken(token)
      if (!claims) {
        throw new AppError(
          401,
          'INVALID_TOKEN',
          'Access token is invalid or has expired.'
        )
      }

      if (roles && !roles.includes(claims.role)) {
        // Names the required role, not the caller's — that is what a developer
        // reading /openapi needs in order to fix the call.
        throw new AppError(
          403,
          'FORBIDDEN',
          `This route requires the ${roles.join(' or ')} role.`
        )
      }

      if (approved && claims.status !== 'APPROVED') {
        const [code, message] = BLOCKED[claims.status]
        throw new AppError(403, code, message)
      }

      return {
        auth: {
          userId: claims.sub,
          role: claims.role,
          status: claims.status,
        } satisfies AuthContext,
      }
    })
    .as('scoped')
}

/** Any signed-in account, whatever its role or approval state. */
export const requireAuth = requireAccess()
