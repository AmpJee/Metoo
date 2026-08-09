/**
 * Types and constants shared between apps.
 *
 * Both apps import this as the `@metoo/shared` workspace dependency: the
 * backend runs it on Bun, the Next.js frontend bundles it. Enum values and
 * their labels live here so a status added on one side cannot silently mean
 * something different on the other.
 */
export * from './constants/roles.ts'
export * from './pricing.ts'
export * from './shipping.ts'
export * from './types/user.ts'
