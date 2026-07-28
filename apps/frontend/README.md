# Frontend

Plain HTML, CSS, and JavaScript served by a small Elysia static server. No
framework, no bundler, no build step — what you write is what the browser gets.

```bash
make dev-frontend   # http://localhost:5173
```

## Layout

```
src/
├── index.ts            the server — never served to the browser
├── pages/              one .html per screen, reachable only via a route
└── public/             everything in here IS web-reachable
    ├── scripts/        one .js per page, plus api-client.js
    └── styles/         base.css (design tokens), components.css
```

The static plugin points at `public/` specifically, not `src/`. That is what
keeps `index.ts` from being downloadable — **do not widen it.**

## Adding a page

1. `src/pages/catalog.html`
2. `src/public/scripts/catalog.js`
3. Register the route in `src/index.ts`:
   ```ts
   .get('/catalog', () => Bun.file(`${PAGES}/catalog.html`))
   ```

Load `/config.js` before your script — it defines the API base URL that
`api-client.js` reads:

```html
<script src="/config.js"></script>
<script type="module" src="/scripts/catalog.js"></script>
```

## Talking to the API

Always go through `api-client.js` rather than calling `fetch` directly, so the
base URL, JSON handling, and error shape stay in one place (and so auth headers
are a one-line change later):

```js
import { api, ApiError } from './api-client.js'

try {
  const products = await api.get('/products')
} catch (error) {
  if (error instanceof ApiError) {
    // error.status, error.code, error.message, error.payload
  }
}
```

## Why `/config.js`

Browser JavaScript cannot read environment variables, and baking the API URL
into the assets at build time would mean a separate image per environment.
Instead the server renders a tiny script from its own `PUBLIC_API_URL`, so one
image runs unchanged locally, in Compose, and on Railway.

## Styling

Use the custom properties in `styles/base.css` (`--color-*`, `--space-*`,
`--radius`) rather than hardcoded values. With no framework enforcing
consistency, the token layer is what keeps a dozen pages looking like one app.
