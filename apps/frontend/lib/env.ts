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
   * Public URL of the platform's PromptPay QR image, in Supabase Storage.
   *
   * The whole URL rather than a bucket and key, so this app needs no Supabase
   * credentials — those stay in the API. Swapping the QR is then a re-upload
   * to the same path, or one variable change.
   *
   * Empty is a valid state: the pay screen says the QR is not set up yet
   * rather than rendering a broken image.
   */
  PROMPTPAY_QR_URL: process.env.PROMPTPAY_QR_URL ?? '',

  /**
   * This site's own public origin, for link previews.
   *
   * Open Graph tags have to be absolute URLs — a chat app fetching the page
   * has no base to resolve against — so Next needs to be told where it is
   * served from. Without it the share card points at localhost, which is
   * worse than having no card at all.
   *
   * Railway injects RAILWAY_PUBLIC_DOMAIN, so production needs no manual
   * setting; SITE_URL overrides it for a custom domain.
   */
  SITE_URL:
    process.env.SITE_URL ??
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : 'http://localhost:5173'),

  /**
   * Cookies are Secure in production. Left off locally because localhost is
   * served over plain HTTP and a Secure cookie would simply never be stored.
   */
  get COOKIE_SECURE() {
    return process.env.NODE_ENV === 'production'
  },
}

export { required }
