/**
 * Access and refresh token signing.
 *
 * Two token types with two different secrets:
 *
 *   access   short-lived, sent on every request in the Authorization header.
 *            Carries the claims routes need (role, status) so that authorising
 *            a request costs no database round-trip.
 *   refresh  long-lived, exchanged for a new pair. Only ever hits /auth/refresh.
 *
 * Signing them with separate secrets means a leaked access secret does not also
 * let an attacker mint refresh tokens, so sessions can be rotated instead of
 * all being invalidated.
 *
 * Standalone functions rather than an Elysia plugin: both the auth service and
 * the RBAC middleware need these, and plugin-scoped decorators are awkward to
 * reach from a service module.
 */
import { SignJWT, jwtVerify } from 'jose'
import type { PipelineStatus, Role } from '@metoo/shared'
import { env } from '../config/env.ts'

const ISSUER = 'metoo-api'

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET)
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET)

export interface AccessClaims {
  sub: string
  role: Role
  status: PipelineStatus
}

export interface RefreshClaims {
  sub: string
  /** Identifies the RefreshToken row, so rotation can revoke exactly this one. */
  jti: string
}

export function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ role: claims.role, status: claims.status })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(accessSecret)
}

export function signRefreshToken(claims: RefreshClaims): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setJti(claims.jti)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_TTL)
    .sign(refreshSecret)
}

/** Returns null for any invalid token — expired, tampered, or wrong issuer. */
export async function verifyAccessToken(
  token: string
): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, { issuer: ISSUER })
    if (!payload.sub) return null

    return {
      sub: payload.sub,
      role: payload.role as Role,
      status: payload.status as PipelineStatus,
    }
  } catch {
    return null
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshClaims | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret, {
      issuer: ISSUER,
    })
    if (!payload.sub || !payload.jti) return null

    return { sub: payload.sub, jti: payload.jti }
  } catch {
    return null
  }
}

/**
 * Refresh tokens are stored hashed, never in plaintext: a leaked database dump
 * then contains no usable credentials.
 *
 * SHA-256 rather than argon2id — unlike a password, the token is already
 * high-entropy random data, so there is nothing for an attacker to guess and
 * no reason to pay argon2's cost on every refresh.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token)
  )
  return Buffer.from(digest).toString('hex')
}

/** Expiry for a newly issued refresh token row, matching JWT_REFRESH_TTL. */
export function refreshTokenExpiry(): Date {
  const match = /^(\d+)([smhd])$/.exec(env.JWT_REFRESH_TTL)
  if (!match) {
    throw new Error(
      `JWT_REFRESH_TTL must look like 30d, 12h, 30m or 45s — got: ${env.JWT_REFRESH_TTL}`
    )
  }

  const amount = Number(match[1])
  const unit = match[2] as 's' | 'm' | 'h' | 'd'
  const seconds = { s: 1, m: 60, h: 3600, d: 86400 }[unit]

  return new Date(Date.now() + amount * seconds * 1000)
}
