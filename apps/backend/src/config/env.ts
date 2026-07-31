/**
 * Environment access, validated once at boot.
 *
 * The rule: a missing or malformed variable must crash the process here, with
 * a message naming the variable. A server that starts half-configured and
 * fails later on a random request is far more expensive to debug.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Copy apps/backend/.env.example to apps/backend/.env and fill it in ` +
        `(or run \`make env\`).`
    )
  }
  return value
}

function optional(name: string, fallback: string): string {
  const value = process.env[name]
  return value && value.trim() !== '' ? value : fallback
}

/**
 * A secret must be long enough that brute-forcing the signature is not
 * practical. 32 characters is the floor for HS256; a short one here would make
 * every token in the system forgeable.
 */
function secret(name: string): string {
  const value = required(name)
  if (value.length < 32) {
    throw new Error(
      `${name} must be at least 32 characters, got ${value.length}.\n` +
        `Generate one with: openssl rand -base64 32`
    )
  }
  return value
}

function port(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(
      `${name} must be an integer between 1 and 65535, got: ${raw}`
    )
  }
  return parsed
}

export const env = Object.freeze({
  /** Pooled Supabase connection (port 6543) — used by the running app. */
  DATABASE_URL: required('DATABASE_URL'),

  /** Direct Supabase connection (port 5432) — used by the Prisma CLI. */
  DIRECT_URL: required('DIRECT_URL'),

  /** Railway injects PORT; locally it comes from .env. */
  PORT: port('PORT', 3000),

  NODE_ENV: optional('NODE_ENV', 'development'),

  /** Browser origin allowed to call this API. */
  CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:5173'),

  // --- Auth ----------------------------------------------------------------
  // Two separate secrets on purpose: if the access secret ever leaks, refresh
  // tokens signed with the other one are still trustworthy, so sessions can be
  // rotated rather than all invalidated.
  JWT_ACCESS_SECRET: secret('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: secret('JWT_REFRESH_SECRET'),

  /** Short by design — the access token lives in localStorage, where any XSS
   *  can read it. A small window limits what a stolen token is worth. */
  JWT_ACCESS_TTL: optional('JWT_ACCESS_TTL', '15m'),
  JWT_REFRESH_TTL: optional('JWT_REFRESH_TTL', '30d'),

  // --- Supabase Storage ----------------------------------------------------
  SUPABASE_URL: required('SUPABASE_URL'),

  /** Service role key — full bypass of row-level security. Server-side only:
   *  this must never reach the browser. */
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),

  SUPABASE_PUBLIC_BUCKET: optional('SUPABASE_PUBLIC_BUCKET', 'product-photos'),
  SUPABASE_PRIVATE_BUCKET: optional(
    'SUPABASE_PRIVATE_BUCKET',
    'verification-docs'
  ),
})

export const isProduction = env.NODE_ENV === 'production'
