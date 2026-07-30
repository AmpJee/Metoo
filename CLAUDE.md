# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Product

**Metoo** is a two-sided B2B wholesale marketplace connecting local Thai brands
with independent retailers (minimarts) — think Faire, for Thailand. Three roles:
**admin**, **brand** (seller), **retailer** (buyer).

This is an MVP and the goal is *people really using it*, not feature
completeness. **Manual operations are intentional, not gaps** — document
verification, logistics, order status transitions and payouts are all
human-driven by design. Do not propose automating them away.

## Commands

```bash
make            # list every task
make env        # create .env files from the examples
make install
make dev        # backend :3000, frontend :5173
make db-migrate # create + apply a migration
make db-seed    # idempotent — safe to re-run
make db-generate# REQUIRED after any schema edit
make db-studio
make check      # lint + format:check + typecheck — run before pushing
make up         # docker compose, both services
```

## Stack — fixed, do not substitute

Bun · Elysia · Prisma v7 · PostgreSQL via Supabase · Supabase Storage ·
Stripe (card + PromptPay) · plain HTML/CSS/JS with **no framework and no
bundler** · Docker · Railway · Turborepo + Bun workspaces · ESLint + Prettier.

Frontend is vanilla by requirement. Do not introduce React, Vue, Tailwind, or a
build step for it.

## Domain rules

These come from the product brief and are non-negotiable:

1. **Checkout splits per brand.** A cart spanning N brands creates N `Order`
   rows sharing a `checkoutGroupId`, each with its own PaymentIntent — never one
   order per checkout session.
2. **Payment failure is never a dead end.** `Payment` is one row *per attempt*;
   a failure leaves the order `PENDING` and the retailer retries against the
   same order.
3. **Returns are post-delivery only.** `DELIVERED`/`SETTLED` is a precondition.
   Accepted → refund + wallet debit + order `CLOSED`. Rejected → order stays
   closed as delivered.
4. **Signup approval loops.** Rejection sets `RESUBMIT_REQUIRED`, never a
   terminal state. `REJECTED` is reserved for a final refusal.
5. **Commission is tiered by category and volume**, in basis points, applied at
   ≥30 orders in the trailing month:

   | Category | New brand | 30+ orders/mo |
   | --- | --- | --- |
   | `FOOD_BEVERAGE` | 400 (4%) | 200 (2%) |
   | `HEALTH_BEAUTY` | 800 (8%) | 500 (5%) |
   | `HOME_LIVING` | 500 (5%) | 300 (3%) |

   The rate is **snapshotted onto the order at checkout** and never recomputed.
6. **Brand approval requires documents** — SME or National ID **plus** an อย.
   (FDA) certificate, reviewed by an admin.

## Decisions that override the original brief

The brief quoted at the bottom of [README.md](README.md) is kept as a historical
record. Three things have since changed — follow these, not the brief:

- **No Stripe Connect. Payouts are a wallet ledger + manual bank transfer.**
  Brands accrue a balance, request a withdrawal, and an admin approves it and
  transfers by bank. *Why:* Stripe Connect eligibility in Thailand is restricted
  and `transfers` capability for TH accounts may require Stripe review — this
  keeps that risk off the critical path. Stripe is used **only to collect**
  payments.
- **Order lifecycle is 8 states, not 3:** `PENDING → CONFIRMED → PREPARING →
  PICKED_UP → DELIVERED → SETTLED`, plus terminal `CANCELLED` and `CLOSED`.
  *Why:* the seller's order-tracking screen needs prepare/pickup visibility, and
  `SETTLED` is the financial step where the sale hits the wallet ledger.
- **Unit tests only — no database in CI.** *Why:* keeps CI fast and simple. The
  consequence is architectural: see the `src/domain/` rule below.

## Conventions

- **Money is `Int` minor units (satang).** Every field is named `*Minor`. This
  maps 1:1 to Stripe amounts and keeps commission math exact. Never use a float
  or `Decimal` for money.
- **The wallet is an append-only ledger.** A brand's balance is
  `SUM(wallet_transactions.amountMinor)`, never a stored column.
  `amountMinor` is signed — credits positive, debits negative. Never update or
  delete a ledger row; correct mistakes with a compensating `ADJUSTMENT` row.
- **Snapshot anything that can change.** `OrderItem` copies product name and
  price; `Order` copies the commission rate and shipping address;
  `WithdrawalRequest` copies bank details. History must stay truthful after the
  source row is edited.
- **Domain logic goes in pure functions under `apps/backend/src/domain/`** —
  no Prisma import, no I/O. Commission, order-state transitions, cart splitting
  and ledger math all live there. This is what makes the unit-tests-only
  decision workable; logic written inline in a Prisma-touching handler cannot be
  tested.
- **One `PrismaClient`**, imported from `src/config/prisma.ts`. Never construct
  another.
- **Throw `AppError`** for expected failures: `new AppError(404, 'NOT_FOUND', msg)`.
  Anything else becomes a 500 and gets logged.
- **Validate at the edge** with TypeBox schemas on `body`/`params`, so bad input
  is rejected with a 422 before handler code runs.
- **Declare `response` schemas.** `/openapi` is the contract the frontend team
  builds against — an undocumented route is a broken handoff.
- **Comments explain *why*, not *what*.** Match the existing codebase, which is
  consistent about this.

## Gotchas

- **`DATABASE_URL` (port 6543, pooled) is for the running app.
  `DIRECT_URL` (port 5432, direct) is for the Prisma CLI.** Migrations use
  prepared statements and advisory locks that the transaction pooler does not
  support. Swapping these is the most common setup mistake here.
- **The generator is `prisma-client`, NOT `prisma-client-js`.** The latter is
  deprecated in v7 and ignores the `runtime`/`moduleFormat` options, which
  breaks the `../generated/prisma/client.ts` import in `config/prisma.ts`.
- **`apps/backend/src/generated/` is a gitignored build artifact.** Run
  `make db-generate` after every schema change.
- **Prisma v7 requires a driver adapter** (`PrismaPg`) — there is no bundled
  query engine. `.env` is not auto-loaded by the CLI; config lives in
  `prisma.config.ts`.
- **Only `apps/frontend/src/public/` is web-reachable.** Do not widen the static
  root to `src/`, or server source becomes downloadable.
- **Bank account numbers are sensitive PII.** `BrandProfile.bankAccountNumber`
  and `WithdrawalRequest.bankAccountNumber` are admin-only: never return them on
  a non-admin route, never write them to logs.
- **PromptPay confirms asynchronously by webhook**, sometimes minutes later.
  Never derive order state from the HTTP response to a payment call.

## Repository layout

```
apps/backend/     Elysia API — config/, modules/, middleware/, lib/, domain/, prisma/
apps/frontend/    Elysia static server — pages/, public/{scripts,styles}/
packages/shared/  types + constants shared by both apps
```

Backend modules follow one pattern per domain folder — copy an existing module
and register it in `src/index.ts` with `.use(...)`. Details in
[apps/backend/README.md](apps/backend/README.md).

## Auth

Tokens go in the `Authorization: Bearer` header, not cookies. Access tokens last
15 minutes and carry `role` + `status` as claims; refresh tokens last 30 days,
are stored hashed, and are rotated on every use.

Protect a route with the single guard in `middleware/auth.ts`:

```ts
.use(requireAccess({ roles: ['BRAND'], approved: true }))
```

`roles` and `approved` are deliberately independent — a `PENDING` brand is
authenticated and *is* a brand, it just cannot reach features yet. Admin routes
set `roles` only, since admins are seeded rather than approved.

Two consequences of `status` being a token claim: an approval does not take
effect until the user's access token refreshes (≤15 min), and `/auth/login`
deliberately succeeds for unapproved accounts so the frontend can show them why
they are blocked.

## Domain layer

`src/domain/` holds the pure functions — no Prisma import, no I/O — that the
unit-tests-only decision depends on. Anything money- or state-related belongs
here, not inline in a handler:

| File | What |
| --- | --- |
| `cart.ts` | `checkQuantity` (MOQ, case size), `groupByBrand`, `lineTotalMinor` |
| `commission.ts` | `resolveCommissionBps` (tier table), `splitAmount` |
| `order-number.ts` | `generateOrderNumber` — non-sequential references |

`groupByBrand` is shared between the cart screen and checkout on purpose, so
the split a retailer sees can never disagree with the orders they get.

Run them with `bun run test`; CI runs the same job with no database.

## Gotcha: optional enum query params

`t.Optional(t.UnionEnum(values))` emits `default: values[0]`, and Elysia applies
it to an **absent** query parameter — so an omitted `?category=` silently means
"FOOD_BEVERAGE" and the endpoint returns a filtered subset with no error. Use
`optionalEnum()` from `lib/schema.ts` for every optional enum filter.

## Status

Done — the data layer (19 models, migrated and seeded), JWT auth with
role/approval guards, the admin signup approval queue, product CRUD, catalog
browse, favourites, the multi-brand cart, and checkout. A retailer can browse,
fill a cart spanning brands, and place orders that split one per brand with the
commission tier snapshotted.

Still to build, in order: Stripe collection (card + PromptPay + webhooks, one
`Payment` row per attempt), the 8-state order lifecycle, the wallet ledger with
admin-approved withdrawals, returns with refunds, Supabase Storage uploads, and
chat.
