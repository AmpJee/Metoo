# Frontend

All three surfaces — buyer, seller and admin — in one Next.js 16 App Router
app: React 19, Tailwind v4, shadcn/ui, built to the designer's Figma files.

```bash
make dev-frontend   # http://localhost:5173
```

| Route group | Role                      | Home       | Shell            |
| ----------- | ------------------------- | ---------- | ---------------- |
| `(shop)`    | RETAILER, ONBOARDED       | `/explore` | top bar + footer |
| `(seller)`  | BRAND, ONBOARDED          | `/seller`  | sidebar          |
| `(admin)`   | ADMIN (no approval check) | `/admin`   | sidebar          |

`lib/roles.ts` decides where a role belongs. Each layout redirects the wrong
role to its own home instead of 403ing, and `proxy.ts` sends post-login
traffic to `/`, which resolves the role once.

## Layout

```
app/
├── layout.tsx          Inter + globals
├── page.tsx            landing (logged out) / role router (logged in)
├── login/ register/ pending/
├── (shop)/             buyer — explore, product, stores, cart, checkout,
│                       orders, saved, returns
├── (seller)/seller/    dashboard, orders, products, wallet, customers,
│                       returns, preview store
├── (admin)/admin/      summary, sellers, retailers, orders, withdrawals,
│                       returns, feedback
├── api/auth/           login | logout | register — the only cookie writers
└── actions/            server actions, one file per domain

components/ui/          button, input, badge, table, field, stat-tile…
components/charts/      recharts wrappers — client-only by necessity
components/             product-card, order-card, order-actions,
                        dashboard-shell, site-header…
lib/                    api, session, token-lifetime, roles, format,
                        order-status
proxy.ts                session renewal, route gating, x-current-path
```

## Two rules that are easy to get wrong

- **Order buttons come from the API.** Both order endpoints return
  `actions: [{ to, label }]`, derived from the transition table in the
  backend's domain layer. `components/order-actions.tsx` renders exactly those
  — a second copy of the state machine here would drift from the one the
  server enforces.
- **The status PATCH body key is `status`, not `to`**, even though the action
  object calls it `to`. Sending `{ to }` fails with a message about the order
  "already" being in its current state, which points nowhere near the cause.

## Charts

Recharts, client components, fed by data the server already fetched. Two
exist, and both are deliberately plain:

- **Seller revenue** (`revenue-chart.tsx`) — one series. `/brand/dashboard`
  also returns an order `count` per bucket, which tempts a second y-axis;
  two scales on one plot invent a correlation the data does not contain, so
  count is a stat tile instead.
- **Admin GMV by brand** (`gmv-by-brand-chart.tsx`) — one measure across
  nominal categories, so every bar is the same colour. Shading by value would
  double-encode bar length as hue. With a single brand it degrades to a stat
  tile, because one bar is not a comparison.

The palette is `#cb2957` on the light surface, checked against the lightness,
chroma and contrast rules rather than eyeballed.

## Auth — read this before changing anything

The browser **never holds a token**. It talks only to this server, which keeps
the session in two httpOnly cookies and forwards requests to Elysia with a
Bearer header. Consequences:

- `API_URL` is server-only. Do **not** rename it to `NEXT_PUBLIC_API_URL`.
- Data fetching happens in Server Components via `lib/api.ts`. A Client
  Component cannot call the API directly — it calls a server action.
- **Renewal lives in `proxy.ts`, not in the API client.** A Server Component
  cannot set cookies during render, so a refresh performed there could never
  be persisted.
- The access cookie's max-age comes from the token's own `exp`
  (`lib/token-lifetime.ts`). That expiry _is_ the renewal trigger — if the
  cookie ever outlived the token, every request would 401 with nothing to
  renew from.
- **Refresh tokens rotate on every use.** `proxy.ts` writes the replacement
  onto the response. Drop that and users are signed out on their next click.

## Gating

Every buyer route on the API requires `roles: ['RETAILER'], approved: true`.
So:

- `proxy.ts` handles signed-in vs not.
- `app/(shop)/layout.tsx` handles ONBOARDED vs not, from the `/auth/me` call
  it already makes for the header. Status is read from the API rather than the
  token claim, so an admin approval takes effect on the next navigation
  instead of whenever the access token happens to expire.
- `/login` deliberately succeeds for unapproved accounts — that is what lets
  `/pending` explain the block.

## Conventions

- **Money is satang.** Always `formatBaht(minor)` from `lib/format.ts`; never
  divide by 100 inline.
- **Enums and labels come from `@metoo/shared`** — `CATEGORY_LABELS`,
  `ORDER_STATUS_LABELS`. Do not retype those strings.
- **Order tab → status mapping lives in `lib/order-status.ts`**, so the tab
  counts and the filtered list cannot disagree.
- **Quantity steppers step by `minPacks`.** The API rejects anything below the
  MOQ or off the case-size multiple with a 422; enforcing it in the control
  means the shopper never meets that error.

## Not built, and why

These are in the design but have no endpoint. They are left out rather than
faked — see the root README's "What to build next":

| Missing                    | Needs                                                  |
| -------------------------- | ------------------------------------------------------ |
| Pay Now / card / PromptPay | a payment module; `POST /checkout` only creates orders |
| Delivery address editing   | `GET`/`PATCH /retailer/profile`                        |
| Vouchers, coin balance     | no schema or routes                                    |
| Chat with seller           | unbuilt                                                |
| Return photos              | a retailer-facing signed upload route                  |
