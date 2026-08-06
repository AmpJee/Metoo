/**
 * Auth use-cases. The route file stays declarative; the Prisma work lives here.
 */
import { randomUUID } from 'node:crypto'
import type { Prisma, Role, User } from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import {
  hashToken,
  refreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../lib/jwt.ts'
import { hashPassword, verifyPassword } from '../../lib/password.ts'
import { AppError } from '../../middleware/error.ts'

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

/** The user shape that crosses the wire. Never includes passwordHash. */
export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    reviewNote: user.reviewNote,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

/**
 * Issues a token pair and records the refresh token.
 *
 * The row stores a hash, and its id becomes the token's `jti`, which is what
 * lets rotation revoke exactly this token rather than every session the user
 * has open on other devices.
 */
async function issueTokens(
  user: Pick<User, 'id' | 'role' | 'status'>,
  tx: Prisma.TransactionClient = prisma
): Promise<TokenPair> {
  const jti = randomUUID()

  const refreshToken = await signRefreshToken({ sub: user.id, jti })

  await tx.refreshToken.create({
    data: {
      id: jti,
      userId: user.id,
      tokenHash: await hashToken(refreshToken),
      expiresAt: refreshTokenExpiry(),
    },
  })

  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
    status: user.status,
  })

  return { accessToken, refreshToken }
}

export interface RegisterBrandInput {
  email: string
  password: string
  role: 'BRAND'
  name: string
  phone: string
  addressLine: string
  province: string
  postalCode: string
  description?: string
}

export interface RegisterRetailerInput {
  email: string
  password: string
  role: 'RETAILER'
  shopName: string
  phone: string
  addressLine: string
  province: string
  postalCode: string
  taxId?: string
}

export type RegisterInput = RegisterBrandInput | RegisterRetailerInput

/**
 * Creates the account and its profile.
 *
 * Both happen in one transaction: a User with no profile cannot log in to
 * anything useful and cannot be reviewed by an admin, so a half-written signup
 * is worse than a failed one.
 *
 * Accounts always start NOT_CONTACTED — the bottom of the sales pipeline. Only
 * an admin moves them to ONBOARDED, so there is no self-service path to an
 * account that can trade.
 */
export async function register(input: RegisterInput) {
  const email = input.email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', `${email} is already registered.`)
  }

  const passwordHash = await hashPassword(input.password)

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, passwordHash, role: input.role, status: 'NOT_CONTACTED' },
    })

    if (input.role === 'BRAND') {
      await tx.brandProfile.create({
        data: {
          userId: user.id,
          name: input.name,
          description: input.description,
          phone: input.phone,
          addressLine: input.addressLine,
          province: input.province,
          postalCode: input.postalCode,
        },
      })
    } else {
      const retailer = await tx.retailerProfile.create({
        data: {
          userId: user.id,
          shopName: input.shopName,
          phone: input.phone,
          addressLine: input.addressLine,
          province: input.province,
          postalCode: input.postalCode,
          taxId: input.taxId,
        },
      })

      // Every retailer needs somewhere to put items; creating the cart up
      // front means no downstream route has to handle a missing one.
      await tx.cart.create({ data: { retailerId: retailer.id } })
    }

    const tokens = await issueTokens(user, tx)
    return { user: toPublicUser(user), ...tokens }
  })
}

/**
 * Note what this does NOT check: pipeline status. An account still being worked
 * through the pipeline must be able to log in, precisely so the frontend can
 * show them where they stand. `requireAccess({ approved: true })` is what gates
 * the actual features.
 */
/**
 * Which site the caller signed in on, so the wrong one can be refused.
 *
 * Each of the three frontends has its own login page. Without this a brand
 * signing in on the retailer site would get a perfectly valid token and then
 * hit 403 on every screen, which reads as "the site is broken" rather than
 * "you are in the wrong place".
 */
const PORTAL_FOR: Record<Role, { account: string; site: string }> = {
  RETAILER: { account: 'a retailer', site: 'the shop' },
  BRAND: { account: 'a brand', site: 'Seller Centre' },
  ADMIN: { account: 'an admin', site: 'the management console' },
}

export async function login(
  rawEmail: string,
  password: string,
  expectedRole?: Role
) {
  const email = rawEmail.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email } })

  // One identical failure for "no such account" and "wrong password". Any
  // difference between the two — message, status, or timing — turns this into
  // an endpoint for discovering who has an account.
  const invalid = new AppError(
    401,
    'INVALID_CREDENTIALS',
    'Email or password is incorrect.'
  )

  if (!user) {
    // Hash anyway so a missing account does not return measurably faster than
    // a wrong password.
    await hashPassword(password)
    throw invalid
  }

  if (!(await verifyPassword(password, user.passwordHash))) throw invalid

  // Checked only after the password, and deliberately so. Answering "wrong
  // site" before verifying would turn this into a way to discover which
  // accounts exist and what they are. After a correct password the caller
  // already owns the account, so naming their site tells them nothing they
  // did not know — and saves them resetting a password that was never wrong.
  if (expectedRole && user.role !== expectedRole) {
    const portal = PORTAL_FOR[user.role]
    throw new AppError(
      403,
      'WRONG_PORTAL',
      `That is ${portal.account} account. Sign in at ${portal.site} instead.`
    )
  }

  const tokens = await issueTokens(user)
  return { user: toPublicUser(user), ...tokens }
}

/**
 * Exchanges a refresh token for a new pair, revoking the old one.
 *
 * Rotation means a stolen refresh token is usable at most once, and the
 * legitimate owner's next refresh fails loudly instead of the theft going
 * unnoticed.
 */
export async function refresh(token: string) {
  const claims = await verifyRefreshToken(token)
  if (!claims) {
    throw new AppError(
      401,
      'INVALID_TOKEN',
      'Refresh token is invalid or has expired.'
    )
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { id: claims.jti },
    include: { user: true },
  })

  const tokenHash = await hashToken(token)

  if (
    !stored ||
    stored.revokedAt !== null ||
    stored.expiresAt < new Date() ||
    stored.tokenHash !== tokenHash
  ) {
    throw new AppError(
      401,
      'INVALID_TOKEN',
      'Refresh token is invalid or has already been used.'
    )
  }

  return prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    const tokens = await issueTokens(stored.user, tx)
    return { user: toPublicUser(stored.user), ...tokens }
  })
}

/**
 * Revokes one session.
 *
 * Deliberately silent on an unknown or already-revoked token: logout should
 * always look like it worked, and reporting otherwise would confirm to an
 * attacker whether a token they hold is real.
 */
export async function logout(token: string) {
  const claims = await verifyRefreshToken(token)
  if (!claims) return

  await prisma.refreshToken.updateMany({
    where: { id: claims.jti, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function findUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      brand: { select: { id: true, name: true } },
      retailer: { select: { id: true, shopName: true } },
    },
  })

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'This account no longer exists.')
  }

  return {
    ...toPublicUser(user),
    brand: user.brand,
    retailer: user.retailer,
  }
}

/**
 * Change a password, then re-issue the session.
 *
 * Every existing refresh token is revoked, including the caller's own, and a
 * fresh pair is returned. That is the point of the operation: someone changing
 * a password usually suspects another session exists, and leaving those alive
 * would defeat the change. Handing back a new pair keeps the caller signed in
 * while everyone else is signed out.
 */
export async function changePassword(params: {
  userId: string
  currentPassword: string
  newPassword: string
}) {
  const user = await prisma.user.findUnique({ where: { id: params.userId } })

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'This account no longer exists.')
  }

  if (!(await verifyPassword(params.currentPassword, user.passwordHash))) {
    // 403, not 401: the caller *is* authenticated. A 401 would tell the
    // frontend to bounce them to /login, losing the form they just filled in.
    throw new AppError(
      403,
      'CURRENT_PASSWORD_WRONG',
      'That is not your current password.'
    )
  }

  if (params.currentPassword === params.newPassword) {
    throw new AppError(
      422,
      'PASSWORD_UNCHANGED',
      'The new password must be different from the current one.'
    )
  }

  const passwordHash = await hashPassword(params.newPassword)

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    await tx.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    // Issued inside the transaction so the new token cannot be revoked by the
    // sweep above — order matters here, not just atomicity.
    return issueTokens(user, tx)
  })
}
