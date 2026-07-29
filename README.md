# Metoo

B2B wholesale marketplace connecting brands and retailers.

> **Status: in progress.** The data layer is complete — 19 models, migrated
> against Supabase and seeded. Auth (JWT + role-based access) and the admin
> signup approval queue are built. The commerce features are not.
> See [What to build next](#what-to-build-next).

## Getting Started

**Prerequisites:** [Bun](https://bun.sh) 1.3+, Node 22.12+ (the Prisma CLI
needs it — `nvm use` picks it up from `.nvmrc`), Docker, and a
[Supabase](https://supabase.com) project.

```bash
make env       # create .env files from the examples
# now edit apps/backend/.env — see "Database URLs" below
make install
make db-migrate
make db-seed
make dev
```

Then open http://localhost:5173. The page turns **green** when the frontend
can reach the API and the API can reach Supabase — that is the whole chain
verified in one glance. Amber means the API is up but the database is not;
red means the API itself is unreachable.

| URL                           | What                          |
| ----------------------------- | ----------------------------- |
| http://localhost:5173         | Web app                       |
| http://localhost:3000         | API                           |
| http://localhost:3000/health  | Liveness + database probe     |
| http://localhost:3000/openapi | Interactive API reference     |

Run `make` on its own to list every available task.

### Database URLs

Supabase gives you two connection strings and **they are not interchangeable**.
Both go in `apps/backend/.env` (Supabase dashboard → Project Settings →
Database → Connection string):

| Variable       | Port | Used by                | Why                                                                                                  |
| -------------- | ---- | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | 6543 | The running app        | Transaction pooler — the right choice for a containerised app holding many short-lived connections.    |
| `DIRECT_URL`   | 5432 | The Prisma CLI         | Migrations use prepared statements and advisory locks, which the transaction pooler does not support. |

Swapping these two is the most common setup mistake here. Migrations run
through 6543 will fail with confusing lock errors.

## Project Structure

```
├── apps/
│   ├── backend/              # Elysia API server
│   │   ├── src/
│   │   │   ├── config/       # env validation, Prisma client + adapter
│   │   │   ├── modules/      # one folder per domain: health, auth, admin
│   │   │   ├── middleware/   # error envelope, auth + RBAC guards
│   │   │   ├── lib/          # logger, jwt, password, Supabase Storage
│   │   │   ├── generated/    # Prisma client — generated, gitignored
│   │   │   └── index.ts      # app entry point
│   │   ├── prisma/           # schema, migrations, seed script
│   │   ├── prisma.config.ts  # Prisma v7 CLI config (replaces .env loading)
│   │   ├── Dockerfile
│   │   └── railway.json
│   │
│   └── frontend/             # Elysia static server + vanilla pages
│       ├── src/
│       │   ├── pages/        # one .html per screen, served via routes
│       │   ├── public/       # everything here is web-reachable
│       │   │   ├── scripts/  # one .js per page, plus api-client.js
│       │   │   └── styles/   # base tokens, components
│       │   └── index.ts      # static server entry point
│       ├── Dockerfile
│       └── railway.json
│
├── packages/
│   └── shared/               # types + constants shared by both apps
│       └── src/
│           ├── types/
│           └── constants/
│
├── .github/workflows/ci.yml  # lint, format, typecheck, docker build
├── docker-compose.yml        # local dev only — Railway ignores this
├── Makefile                  # every task; run `make` to list them
├── eslint.config.mjs
├── turbo.json
└── package.json
```

Two structural rules worth knowing:

- **`apps/frontend/src/public/` is the only web-reachable directory.** The
  static plugin points at it specifically so that server source (`index.ts`)
  is never downloadable. Do not widen it to `src/`.
- **`apps/backend/src/generated/` is a build artifact.** Prisma v7 emits plain
  TypeScript into the source tree. It is gitignored; run `make db-generate`
  after any schema change.

## Deployment (Railway)

Railway does not read `docker-compose.yml`. Create **two services from this
same repo** — each picks up its own `apps/*/railway.json`, which sets the
Dockerfile path and watch patterns so a frontend commit does not rebuild the
backend.

Leave each service's **root directory unset** (repo root). The Docker build
context must reach `bun.lock` and `packages/shared`; setting a per-service
root directory breaks the workspace install.

Set these variables — the `${{...}}` syntax is Railway's cross-service
reference, so no URL is ever hardcoded:

| Service  | Variable         | Value                                        |
| -------- | ---------------- | -------------------------------------------- |
| backend  | `DATABASE_URL`   | Supabase pooler URL (6543)                   |
| backend  | `DIRECT_URL`     | Supabase direct URL (5432)                   |
| backend  | `CORS_ORIGIN`    | `https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}` |
| frontend | `PUBLIC_API_URL` | `https://${{backend.RAILWAY_PUBLIC_DOMAIN}}`  |

Do **not** set `PORT` — Railway injects it and both apps already read it.

Migrations run automatically: the backend's `preDeployCommand` runs
`prisma migrate deploy` before the new container takes traffic.

## What to build next

Done: the schema (19 models), auth (JWT + `requireAccess` role/approval
guards), and the admin signup approval queue.

Still to do, in dependency order:

1. **Catalog** — brand product CRUD, Supabase Storage upload routes (public
   bucket for photos, private + signed URLs for ID/อย. documents), retailer
   browse and filter, favourites.
2. **Cart and checkout** — cart with MOQ and case-size validation, then the
   checkout that **splits one cart into one order per brand** and snapshots the
   commission tier onto each order.
3. **Payments** — Stripe card + PromptPay collection and webhooks. PromptPay
   confirms asynchronously, so order state must come from the webhook, never
   from the HTTP response.
4. **Fulfilment and wallet** — the 8-state order lifecycle, the append-only
   wallet ledger, and admin-approved withdrawals paid by manual bank transfer.
5. **Post-sale** — returns with refunds, and chat.
6. **Pages** — one `.html` in `src/pages/` and one `.js` in
   `src/public/scripts/` per screen, all API calls going through
   `api-client.js`.
7. **Unit tests** — pure functions under `src/domain/` (commission, cart
   splitting, state transitions, ledger math), plus a `test` job in CI.

Conventions and the decisions that supersede the brief below are in
[CLAUDE.md](CLAUDE.md); module patterns are in
[apps/backend/README.md](apps/backend/README.md).

---

## Original Brief

### Prompt for LLM

```
PROMPT
Production grade clean code project for B2B wholesale marketplace (brands ↔ retailers)
1. app has roles: admin, brand, retailer
2. admin can approve/reject brand and retailer signups, manually update order status (pending → confirmed → delivered), and approve/reject return requests
3. brand can list products (name, photo, price, MOQ, case size, category), manage incoming orders, and receive payouts via Stripe Connect minus platform commission
4. retailer can browse/filter catalog by category, add to cart across multiple brands, checkout, track order status, chat with brand, favourite products, and request returns post-delivery
5. design db diagram and write code with following tech stack
6. with protected routes JWT strategy, role-based access control (admin/brand/retailer)

#Condition
If retailer's cart spans multiple brands, checkout must split into one order per brand, not one order per checkout session
Payment failure keeps order in pending/failed state, retailer can retry checkout — never a dead end
Return requests only allowed post-delivery; seller/admin reviews; accepted → refund processed + order closed, rejected → order stays closed as delivered
Brand and retailer signups require manual approval before account is active; rejection loops back to a resubmit state, not a dead end
Commission is tiered by category and volume: Food & Beverage 4%/2%, Health & Beauty 8%/5%, Home & Living 5%/3% (new brand / 30+ orders per month)
Brand approval requires ID (SME/National ID) + อย. certificate check

Pls summarize requirements and count file when i said correct start write code

#Backend
1. Bun
2. Elysia
3. PostgreSQL via Supabase
4. Prisma ORM
5. Supabase Storage (public bucket for product photos, private bucket + signed URLs for verification documents)
6. Stripe (card + PromptPay) + Stripe Connect for brand payouts
7. JWT auth with role-based middleware

#Frontend
8. Plain HTML/CSS/JS, no framework, served via separate Elysia static app

#Deployment
1. Docker (backend + frontend)
2. Railway
3. GitHub Actions CI (lint, typecheck, backend tests against real Postgres, build)
```