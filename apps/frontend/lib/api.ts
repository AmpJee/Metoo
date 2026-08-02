import 'server-only'
import { env } from './env'
import { readTokens } from './session'

/**
 * Server-side client for the Elysia API.
 *
 * Runs only on the server: it reads the httpOnly access-token cookie and
 * forwards it as a Bearer header, so the browser never handles a token.
 *
 * Note what this does NOT do: refresh. A Server Component cannot set cookies
 * during render, so a refresh performed here could never be persisted and the
 * next request would repeat it. Refresh is middleware's job — see
 * middleware.ts, which renews the session before the request reaches a page.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly payload?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** The caller should send the user to /login. */
  get isUnauthorized() {
    return this.status === 401
  }

  /** Authenticated, but not an ONBOARDED retailer — send them to /pending. */
  get isForbidden() {
    return this.status === 403
  }
}

type Options = {
  method?: string
  body?: unknown
  /** Skip the Authorization header — only /auth/login and /auth/register. */
  anonymous?: boolean
  /** Next fetch cache options; defaults to no-store for authenticated data. */
  next?: { revalidate?: number; tags?: string[] }
  cache?: RequestCache
}

export async function apiFetch<T>(
  path: string,
  options: Options = {}
): Promise<T> {
  const { method = 'GET', body, anonymous = false, next, cache } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['content-type'] = 'application/json'

  if (!anonymous) {
    const { accessToken } = await readTokens()
    if (!accessToken) {
      throw new ApiError(401, 'NO_SESSION', 'Not signed in.')
    }
    headers.authorization = `Bearer ${accessToken}`
  }

  let response: Response
  try {
    response = await fetch(`${env.API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Authenticated responses are per-user; caching them across users would
      // leak one retailer's cart to another.
      cache: cache ?? (next ? undefined : 'no-store'),
      next,
    })
  } catch (cause) {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      `Cannot reach the API at ${env.API_URL}: ${(cause as Error).message}`
    )
  }

  if (response.status === 204) return undefined as T

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string } })
      ?.error
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? `Request failed with ${response.status}.`,
      payload
    )
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, options?: Omit<Options, 'method' | 'body'>) =>
    apiFetch<T>(path, options),
  post: <T>(path: string, body?: unknown, options?: Options) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Options) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: Options) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: Options) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
}
