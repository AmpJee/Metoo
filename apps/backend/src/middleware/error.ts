/**
 * One consistent error shape for every route: `{ error: { code, message } }`.
 *
 * Elysia's `onError` runs for thrown errors and for failed schema validation,
 * so validation failures come back as 422 with the same envelope rather than
 * Elysia's raw internal format.
 */
import { Elysia } from 'elysia'
import { isProduction } from '../config/env.ts'
import { logger } from '../lib/logger.ts'

/** Throw this for expected failures (not found, forbidden, conflict...). */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /**
     * Machine-readable extras for the caller, merged into the error body.
     *
     * For failures the frontend has to *act* on rather than print. The
     * message is English and always will be — the API has no idea who is
     * reading it — so anything a Thai screen needs to say in its own words,
     * or turn into a link, has to arrive as data. WRONG_PORTAL is the case
     * that forced this: "sign in at Seller Centre" is useless as a sentence
     * and useful as a role the frontend can route on.
     */
    readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorHandler = new Elysia({ name: 'error-handler' })
  .onError(({ code, error, set, path }) => {
    // `instanceof`, not Elysia's `.error({ APP_ERROR: AppError })` registry:
    // the registry is scoped to the instance that declares it, so an AppError
    // thrown inside a separately-mounted module never matches here and would
    // fall through to the 500 branch below.
    if (error instanceof AppError) {
      set.status = error.status
      return {
        error: {
          code: error.code,
          message: error.message,
          ...error.details,
        },
      }
    }

    if (code === 'VALIDATION') {
      set.status = 422
      return {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body failed validation.',
          details: error.all,
        },
      }
    }

    if (code === 'NOT_FOUND') {
      set.status = 404
      return {
        error: { code: 'NOT_FOUND', message: `No route matches ${path}.` },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    logger.error('Unhandled error', { path, code, message })

    set.status = 500
    return {
      error: {
        code: 'INTERNAL_ERROR',
        // Never leak internals to clients in production.
        message: isProduction ? 'Something went wrong.' : message,
      },
    }
  })
  .as('global')
