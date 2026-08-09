/**
 * Where a person reaches a person.
 *
 * One constant because it appears in more than one place — the help centre and
 * the footer — and an address that is right in one and stale in the other is
 * worse than either. Change it here.
 *
 * Not an environment variable on purpose: it is published on a public page, so
 * there is nothing to keep secret, and a missing env var would render an empty
 * mailto rather than fail loudly.
 */
export const SUPPORT_EMAIL = 'metoo.wholesale@gmail.com'
