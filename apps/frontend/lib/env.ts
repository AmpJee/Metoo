/**
 * Server-side environment.
 *
 * `API_URL` is deliberately NOT a NEXT_PUBLIC_ variable. The browser never
 * calls Elysia directly — it calls this Next server, which holds the tokens
 * and forwards the request. Exposing the API origin to the client would
 * invite someone to bypass that.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy apps/frontend/.env.example to .env (or run \`make env\`).`
    )
  }
  return value
}

export const env = {
  API_URL: process.env.API_URL ?? 'http://localhost:3000',

  /**
   * Cookies are Secure in production. Left off locally because localhost is
   * served over plain HTTP and a Secure cookie would simply never be stored.
   */
  get COOKIE_SECURE() {
    return process.env.NODE_ENV === 'production'
  },
}

export { required }
