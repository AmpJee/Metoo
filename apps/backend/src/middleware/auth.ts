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
import { TRADING_STATUS } from '@metoo/shared'
import type { PipelineStatus, Role } from '@metoo/shared'
import { prisma } from '../config/prisma.ts'
import { verifyAccessToken } from '../lib/jwt.ts'
import { AppError } from './error.ts'

export interface AuthContext {
  userId: string
  role: Role
  status: PipelineStatus
}

export interface AccessOptions {
  /** Allowed roles. Omit to accept any authenticated account. */
  roles?: Role[]
  /** Require the account to be ONBOARDED — i.e. cleared to trade. */
  approved?: boolean
}

function bearerToken(header: string | undefined): string | null {
  if (!header) return null

  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null

  return token
}

/**
 * Each non-trading state gets a distinct error code so the frontend can route
 * to the right screen instead of showing one generic "forbidden". An applicant
 * still being worked through the pipeline needs a different message from one
 * who has been declined.
 */
const BLOCKED: Record<
  Exclude<PipelineStatus, typeof TRADING_STATUS>,
  [string, string]
> = {
  NOT_CONTACTED: [
    'ACCOUNT_NOT_ONBOARDED',
    'Your application is in the queue. We will be in touch shortly.',
  ],
  CONTACTED: [
    'ACCOUNT_NOT_ONBOARDED',
    'We are reviewing your application. We will be in touch shortly.',
  ],
  INTERESTED: [
    'ACCOUNT_NOT_ONBOARDED',
    'Your onboarding is in progress. We will be in touch shortly.',
  ],
  DECLINED: [
    'ACCOUNT_DECLINED',
    'Your application was not accepted at this time.',
  ],
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

      // The claim is a snapshot from when the token was issued, up to 15
      // minutes ago. An admin may have approved this account since — so a
      // token that says "not onboarded" is re-checked against the database
      // before anyone is turned away.
      //
      // Only on the refusing path, so an already-onboarded caller — almost
      // all traffic — still costs zero queries. Without this the frontend and
      // the API disagree the moment an approval lands: the shop layout reads
      // the live status from /auth/me and lets the retailer in, then every
      // request behind this guard 403s, and the page renders as a crash
      // rather than as the pending screen.
      let status = claims.status

      if (approved && status !== TRADING_STATUS) {
        const current = await prisma.user.findUnique({
          where: { id: claims.sub },
          select: { status: true },
        })

        status = current?.status ?? status

        if (status !== TRADING_STATUS) {
          const [code, message] = BLOCKED[status]
          throw new AppError(403, code, message)
        }
      }

      return {
        auth: {
          userId: claims.sub,
          role: claims.role,
          status,
        } satisfies AuthContext,
      }
    })
    .as('scoped')
}

/** Any signed-in account, whatever its role or approval state. */
export const requireAuth = requireAccess()

/**
 * Resolve the caller if there is one, and let them through either way.
 *
 * For the public catalog. A shopper browsing before they sign up must reach
 * these routes, but a signed-in retailer on the same route should still get
 * the parts that are about them — whether they follow this brand, for one —
 * and a second, anonymous-only endpoint would mean two implementations of one
 * screen, free to drift.
 *
 * `auth` is null rather than absent, so a handler cannot read it without
 * having dealt with the anonymous case. A bad or expired token is treated as
 * no token at all: the whole point is that being signed out is not an error
 * here, and someone whose session lapsed mid-browse should see the catalog,
 * not a 401.
 */
export const optionalAccess = new Elysia({ name: 'optional-access' })
  .derive({ as: 'scoped' }, async ({ headers }) => {
    const token = bearerToken(headers.authorization)
    if (!token) return { auth: null }

    const claims = await verifyAccessToken(token)
    if (!claims) return { auth: null }

    return {
      auth: {
        userId: claims.sub,
        role: claims.role,
        status: claims.status,
      } satisfies AuthContext,
    }
  })
  .as('scoped')
