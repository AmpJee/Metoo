/**
 * Password hashing.
 *
 * Bun ships argon2id, so there is no bcrypt dependency to install or keep
 * patched. Defaults are deliberate: argon2id is the algorithm OWASP recommends
 * for new applications, and Bun's cost parameters are already in the
 * recommended range.
 */

export function hashPassword(plain: string): Promise<string> {
  return Bun.password.hash(plain, { algorithm: 'argon2id' })
}

/**
 * Bun.password.verify throws — rather than returning false — when the stored
 * string is not a hash it recognises. That happens with rows seeded or
 * migrated by hand, and an exception there would surface as a 500 on a login
 * attempt instead of a clean "wrong credentials". Treat it as a failed match.
 */
export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  try {
    return await Bun.password.verify(plain, hash)
  } catch {
    return false
  }
}
