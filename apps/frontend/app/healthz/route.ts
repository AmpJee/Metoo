/**
 * Is this web server up?
 *
 * Railway's healthcheck used to hit `/`, which worked while `/` rendered a
 * page. It now redirects — to the catalog for a visitor, to their own console
 * for a signed-in user — and a 307 is not a passing healthcheck, so every
 * deploy failed at the network step while the build and the app itself were
 * fine.
 *
 * Deliberately touches nothing. It does not call the API or the database: a
 * healthcheck answers "should traffic come here", and a frontend that is
 * serving perfectly well should not be pulled out of rotation because
 * Postgres hiccuped. The backend has its own /health for its own liveness.
 */
export const dynamic = 'force-dynamic'

export function GET() {
  return new Response('ok', {
    status: 200,
    headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' },
  })
}
