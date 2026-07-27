/**
 * Types and constants shared between apps.
 *
 * Consumed by the backend via the `@metoo/shared` workspace dependency.
 * The frontend is plain browser JS with no bundler, so it cannot import this
 * package — values the browser needs are served at runtime from the frontend
 * server's `/config.js` route instead.
 */
export * from './constants/roles.ts'
export * from './types/user.ts'
