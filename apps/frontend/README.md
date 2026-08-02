# Frontend

The **retailer (buyer) site** — Next.js 16 App Router, React 19, Tailwind v4
and shadcn/ui, built to the designer's Figma file.

```bash
make dev-frontend   # http://localhost:5173
```

The seller and admin dashboards are separate designs and belong in
`app/(seller)/` and `app/(admin)/` route groups alongside `app/(shop)/`. All
three share the palette already in `app/globals.css`.

## Layout

```
app/
├── layout.tsx          Inter + globals
├── page.tsx            landing — the only page with no session
├── login/ register/ pending/
├── (shop)/             every screen behind the ONBOARDED gate
│   ├── layout.tsx      header + footer, and the gate itself
│   ├── explore/        catalog, category filter, search, cursor paging
│   ├── products/[id]/  detail, add to cart, favourite / save
│   ├── stores/         brand directory and storefronts
│   ├── cart/ checkout/
│   ├── orders/         My Purchase tabs, tracking, checkout groups
│   ├── saved/ returns/
├── api/auth/           login | logout | register — the only cookie writers
└── actions/            server actions: cart, checkout, saved, follow, returns

components/ui/          button, input, badge, empty-state
components/             product-card, order-card, order-tracker, site-header…
lib/                    api, session, token-lifetime, format, order-status
proxy.ts                session renewal + route gating
```

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
