/**
 * Human-readable order references — pure, no Prisma, no I/O.
 *
 * Format: MT-YYMMDD-XXXXXX, e.g. MT-260730-K7Q2M9
 *
 * Deliberately NOT sequential. A retailer who sees MT-000412 on their own
 * order learns roughly how many orders the platform has taken, and two orders
 * a week apart reveal the rate — competitive information that a marketplace
 * gives away for free by counting in public.
 *
 * The date prefix is for humans: support conversations start with "which day?",
 * and having it in the reference saves a lookup.
 */

/**
 * Crockford's base32, minus I, L, O and U.
 *
 * The excluded letters are the ones people misread or mistype when copying a
 * reference off a screen or reading it down a phone — I/1, O/0, and U because
 * removing it keeps accidental profanity out of generated codes.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

const RANDOM_LENGTH = 6

/**
 * 32^6 ≈ 1.07 billion. Collisions are still possible in principle, so
 * `Order.orderNumber` carries a unique constraint and the caller retries — this
 * function makes collisions rare, the database makes them impossible.
 */
export function generateOrderNumber(now = new Date()): string {
  const yy = String(now.getUTCFullYear()).slice(-2)
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')

  // crypto, not Math.random: an order reference is quoted as weak proof that
  // you placed the order, so it should not be predictable from another one.
  const bytes = crypto.getRandomValues(new Uint8Array(RANDOM_LENGTH))
  let suffix = ''
  for (const byte of bytes) {
    suffix += ALPHABET[byte % ALPHABET.length]
  }

  return `MT-${yy}${mm}${dd}-${suffix}`
}

/** Shape check, used by tests and by any future lookup-by-reference route. */
export function isOrderNumber(value: string): boolean {
  return new RegExp(`^MT-\\d{6}-[${ALPHABET}]{${RANDOM_LENGTH}}$`).test(value)
}
