/**
 * Thin wrapper over fetch for talking to the Metoo API.
 *
 * Every page should go through this rather than calling fetch directly, so
 * that the base URL, JSON handling, and error shape live in one place. When
 * auth lands, the token header goes here too — one edit, every page covered.
 */

const config = window.__APP_CONFIG__ ?? {}
const BASE_URL = config.apiUrl ?? 'http://localhost:3000'

/** Error carrying the API's `{ error: { code, message } }` envelope. */
export class ApiError extends Error {
  constructor(status, code, message, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    /** Parsed response body. Some failures carry a useful one — /health
     *  returns 503 with a real report of what is down. */
    this.payload = payload
  }
}

async function request(path, options = {}) {
  const { body, headers, ...rest } = options

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (cause) {
    // Network-level failure: server down, DNS, CORS rejection.
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      `Cannot reach ${BASE_URL}: ${cause.message}`
    )
  }

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = payload?.error ?? {}
    throw new ApiError(
      response.status,
      error.code ?? 'UNKNOWN_ERROR',
      error.message ?? `Request failed with ${response.status}.`,
      payload
    )
  }

  return payload
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  baseUrl: BASE_URL,
}
