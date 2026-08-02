/**
 * Bank account presentation — pure, no Prisma, no I/O.
 *
 * A full account number is admin-only PII. Everywhere else shows the last four
 * digits, which is enough for a brand to recognise which of its accounts is on
 * file and useless to anyone who intercepts it.
 */

/**
 * The last four DIGITS, not the last four characters.
 *
 * Account numbers are normally entered with separators — "123-4-56789-0" — so
 * slicing the raw string yields "89-0", which is not what "•••• 4821" in the
 * design means and looks like a rendering fault to anyone reading it.
 *
 * Returns null when there is nothing on file, or when what is on file holds
 * fewer than four digits: a partial mask is worse than an honest absence,
 * because it reads as "an account is configured" when none usably is.
 */
export function accountLast4(accountNumber: string | null | undefined) {
  if (!accountNumber) return null

  const digits = accountNumber.replace(/\D/g, '')
  return digits.length >= 4 ? digits.slice(-4) : null
}
