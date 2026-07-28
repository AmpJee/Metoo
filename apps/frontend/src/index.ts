/**
 * Static server for the vanilla HTML/CSS/JS frontend.
 *
 * Deliberately not a build tool. Assets are served as-is; there is no bundler,
 * no transpile step, no framework. Edit a file and reload.
 *
 * Layout matters here:
 *   src/public/  served wholesale — everything in it is public by definition
 *   src/pages/   reachable only through an explicit route below
 *   src/index.ts this file, never served
 *
 * Pointing the static plugin at a directory that holds *only* public files is
 * what keeps server source from being downloadable. Do not widen it to src/.
 */
import { staticPlugin } from '@elysiajs/static'
import { Elysia } from 'elysia'

const PORT = Number(process.env.PORT ?? 5173)
const PUBLIC_API_URL = process.env.PUBLIC_API_URL ?? 'http://localhost:3000'

const PAGES = `${import.meta.dir}/pages`
const PUBLIC = `${import.meta.dir}/public`

/**
 * Runtime config injected into the browser.
 *
 * Browser JS cannot read environment variables, and we do not want a build
 * step that bakes the API URL into the assets — that would mean a separate
 * image per environment. Instead the server renders this tiny script from its
 * own env, so one image works locally, in Compose, and on Railway.
 */
const configScript = `window.__APP_CONFIG__ = ${JSON.stringify({
  apiUrl: PUBLIC_API_URL,
})};\n`

export const app = new Elysia()
  .get(
    '/config.js',
    () =>
      new Response(configScript, {
        headers: {
          'content-type': 'application/javascript; charset=utf-8',
          // Never cache: the value differs per environment.
          'cache-control': 'no-store',
        },
      })
  )

  // `prefix: ''` keeps URLs like /styles/base.css mirroring the on-disk layout
  // under public/, so paths in the HTML read exactly as the files are stored.
  .use(
    staticPlugin({
      assets: PUBLIC,
      prefix: '',
    })
  )

  // Pages. Add one route per screen as the team builds them out.
  .get('/', () => Bun.file(`${PAGES}/index.html`))

  .onError(({ code }) => {
    if (code === 'NOT_FOUND') {
      return new Response('Not found', { status: 404 })
    }
  })

// `0.0.0.0`, not localhost — otherwise the server is unreachable from outside
// its container.
app.listen({ hostname: '0.0.0.0', port: PORT }, ({ port }) => {
  console.warn(`Frontend on http://localhost:${port} (API: ${PUBLIC_API_URL})`)
})
