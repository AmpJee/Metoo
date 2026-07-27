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
})

export const isProduction = env.NODE_ENV === 'production'
