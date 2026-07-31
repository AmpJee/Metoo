# Backend build log

A running record of what was built, in what order, and **why** — so anyone
picking this up (including a fresh AI session with no memory of the work) can
continue without re-deriving the decisions.

Conventions live in [CLAUDE.md](../CLAUDE.md). Module patterns live in
[apps/backend/README.md](../apps/backend/README.md). This file is the history
and the reasoning.

---

## Picking up from cold

```bash
make env          # then fill apps/backend/.env — see "Environment" below
make install
make db-migrate
make db-seed
make dev-backend  # http://localhost:3000, docs at /openapi
```

**Seeded accounts**, password `password123` for all:

| Email | Role | Pipeline status |
| --- | --- | --- |
| `admin@metoo.test` | ADMIN | ONBOARDED |
| `brand@metoo.test` | BRAND | ONBOARDED (Siam Craft Goods) |
| `pending-brand@metoo.test` | BRAND | INTERESTED (for the pipeline board) |
| `retailer@metoo.test` | RETAILER | ONBOARDED (Somchai Minimart) |

Most routes need `Authorization: Bearer <token>` from `POST /auth/login`.
Without one you get 401s and it looks like the docs are wrong.

### Environment

`apps/backend/.env` needs, beyond the two Supabase connection strings:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — 32+ chars, different from each
  other (`openssl rand -base64 32`)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — the key is a JWT starting `eyJ`;
  the server refuses to boot otherwise

**Known gap:** `SUPABASE_SERVICE_ROLE_KEY` is still a placeholder on the
development machine, so the Supabase upload round trip has never been executed
against real storage. Everything up to the storage call is verified.

---

## Current state

- **65 routes**, **18 modules**, **20 models**, **8 migrations**
- **135 domain unit tests**, no database in CI
- Merged through **PR #13**; `feature/uploads` open

**What works end to end:** a brand registers → admin walks it through the sales
pipeline to ONBOARDED → brand lists products → retailer browses, fills a cart
spanning brands → checkout splits it into one order per brand with commission
snapshotted → brand walks each order through seven states → confirming "Money
Received" credits the brand's wallet ledger → brand requests a withdrawal →
admin approves and marks it paid. Retailers can review delivered products and
raise returns; accepting one refunds, unwinds the wallet and closes the order.

### Layout

```
apps/backend/src/
  domain/     pure functions, no Prisma, no I/O — this is what CI tests
  lib/        jwt, password, supabase, profile, schema, order-facts, logger
  middleware/ error envelope, requireAccess (auth + role + onboarding)
  modules/    one folder per domain: index.ts (routes) + service.ts (Prisma)
```

`src/domain/` holds `analytics`, `cart`, `commission`, `ledger`,
`order-number`, `order-state`, `rating`, `returns`, `upload`.

---

## History

Each row is one merged PR. Every commit within them compiles and passes
lint/format/typecheck/tests **on its own** — verified by checking out each SHA
separately, not just the branch tip.

| PR | Branch | What it delivered |
| --- | --- | --- |
| #3 | `feature/setup-database` | 19-model schema, migration, seed, CLAUDE.md |
| #4 | `feature/auth` | JWT + rotating refresh, `requireAccess`, admin approvals |
| #5 | `feature/catalog` | Product CRUD, browse, favourites, multi-brand cart |
| #6 | `feature/checkout` | Per-brand order splitting, commission engine, order views |
| #7 | `feature/sales-pipeline` | Pack pricing, 4th category, READY_FOR_PICKUP, CRM pipeline |
| #8 | `feature/order-fulfilment` | Order state machine, brand + admin order management |
| #9 | `feature/brand-wallet` | Ledger, settlement credit, withdrawals |
| #10 | `feature/analytics` | Seller dashboard, admin weekly summary |
| #11 | `fix/consolidate-revenue-statuses` | Removed duplicated status lists and selects |
| #12 | `feature/product-reviews` | Ratings with a verified-purchase guard |
| #13 | `feature/returns` | Returns, refunds, wallet unwind |
| — | `feature/uploads` *(open)* | Photo + verification document uploads |

---

## Decisions that override the original brief

The brief at the bottom of [README.md](../README.md) is kept as a historical
record. These supersede it.

**No Stripe. No Stripe Connect. Payment is manual.**
Connect eligibility in Thailand is restricted, and `transfers` for TH accounts
may need Stripe review — that risk does not belong on the critical path. Then
the design turned out to have *no payment step at all*: the seller presses
"Confirm Money Received" at the end of the order tracker, and payment appears
only as a column (PromptPay / Card / Cash) in the admin table. So
`Order.paymentMethod` records intent, and `SETTLED` is the confirmation.
Payouts are a wallet ledger plus manual bank transfer.

**Order lifecycle is 9 states, not 3.**
`PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP → PICKED_UP → DELIVERED →
SETTLED`, plus `CANCELLED` and `CLOSED`. The seller's tracker in the design
shows seven steps; `READY_FOR_PICKUP` was missing from the original enum.

**Unit tests only, no database in CI.**
Keeps CI fast. The consequence is architectural: anything money- or
state-related has to live in `src/domain/` as a pure function, or it cannot be
tested at all.

**The admin console is a sales CRM, not an approval queue.**
`AccountStatus` was replaced by `PipelineStatus`
(NOT_CONTACTED → CONTACTED → INTERESTED → ONBOARDED → DECLINED), and
**ONBOARDED is the authorisation gate**. `RESUBMIT_REQUIRED` is gone. The
design's Sellers table tracks outreach — business size, IG handle, case spec,
referral source, notes — not a signup queue.

**Commission stays tiered** (FOOD_BEVERAGE 400/200, HEALTH_BEAUTY 800/500,
HOME_LIVING 500/300 bps at ≥30 orders/month). The admin prototype shows a flat
10%, treated as placeholder data.

### Open question

**`FASHION_ACCESSORIES` commission is a placeholder at 600/400 bps.** That
category exists only in the design, so no commercial rate was ever set for it.
One line in `domain/commission.ts` when someone decides.

---

## Design reconciliation

Three Figma prototypes are the source of truth for anything UI-facing:

- Seller Centre — `sleek-prong-83718419.figma.site`
- Management Console — `cycle-elude-57953292.figma.site`
- Marketplace (mobile) — `swell-cupid-10942859.figma.site`

Walking them found four conflicts that invalidated already-merged code, all
resolved in PR #7:

1. **Everything is sold by the pack.** Price is per pack, quantity is ordered
   in packs, `minPacks` is a minimum number of packs, and `unitsPerPack` is
   descriptive only. The old code enforced a case-size divisibility rule that
   **does not exist in the design** — it rejected "6 packs of a 5-units/pack
   product", which every screen shows as valid.
2. **Four categories**, not three — Fashion & Accessories was missing.
3. **`READY_FOR_PICKUP`** was missing from the lifecycle.
4. **The CRM pipeline** replaced the approval queue.

### Inconsistencies inside the design itself

- Order numbers are `MT260730A` on the seller screen but `O-1042` on admin.
  **We use `MT-YYMMDD-XXXXXX` with a random suffix** — deliberately not
  sequential, since a sequential reference tells any retailer how many orders
  the platform took that day. This is the one place the design is not copied
  literally.
- The seller screen shows 7 statuses; admin filters on 3.
- Admin shows a flat 10% commission; the brief specifies tiers.
- The design has **no returns screen at all** — returns were built to the
  brief.

---

## Gotchas found the hard way

**`t.Optional(t.UnionEnum(values))` silently filters.**
It emits `default: values[0]`, and Elysia applies that default to an *absent*
query parameter. An omitted `?category=` meant "FOOD_BEVERAGE", and
`GET /admin/approvals` with no filter returned only pending brands. Use
`optionalEnum()` from `lib/schema.ts` for every optional enum filter. This
shipped undetected in the auth PR because the test passed the filter
explicitly.

**Three "modelled but unreachable" paths existed.** Each was a model nothing
could write:
- `REFUND_DEBIT` in the ledger enum — fixed by returns (PR #13)
- `Refund` required `paymentId` + `stripeRefundId`, but payment is manual so no
  `Payment` rows exist — fixed in PR #13
- `VerificationDocument` was only ever read; admin could mint signed URLs for
  rows nothing created, making the ID + อย. requirement unreachable — fixed by
  `feature/uploads`

Worth checking for a fourth before adding any new model.

**Elysia's `derive` does not type-narrow across `.use()`.** Chaining
`requireAuth` then `requireRole` left `auth` possibly-undefined and verified the
JWT twice. `requireAccess({ roles, approved })` does everything in one derive.

**`t.Record` keyed by a union enum infers its value type as `never`.** Spell the
keys out instead — see `brand-orders/index.ts` counts.

**Prisma cannot `groupBy` a relation field.** Store ratings per brand need a raw
`$queryRaw` joining products.

**`UID` and `GID` are readonly in zsh.** Shell verification scripts using them
as variables fail with a confusing "bad math expression".

**`pkill` does not free the port instantly.** A second server started too
quickly dies with `EADDRINUSE` and the old one keeps serving — which looks
exactly like "the new routes 404". Check the log, not the response.

---

## How verification is done

Each branch is verified three ways before the PR:

1. **Per-commit gates** — check out every SHA and run tsc, lint, format, tests
   individually. This caught a commit that referenced a module not yet in it.
2. **Against real data** — boot the API, drive the actual flow with curl,
   inspect the database directly.
3. **Cross-checked arithmetic** — every money and analytics figure is compared
   against raw SQL. Refactors are proved no-ops by producing identical numbers
   before and after.

Test data is cleared and the seed restored afterwards.

---

## What is left

Purely design surface — nothing functional is missing:

| Item | Notes |
| --- | --- |
| Save for later | The design treats it as separate from favourites; a `type` discriminator on `Favourite` |
| Follows | Follower counts and a Follow button on the storefront |
| Public storefront | Brand page; mostly assembling what exists |
| Customers list | Seller side, aggregated from orders |
| Feedback Log | Admin nav item, new model |
| Chat | Threads and messages; polling, no websockets |

Also outstanding: `gh` is not authenticated on the dev machine, so PRs are
opened by hand; and the frontend (owned by teammates) builds against
`/openapi`, which is the contract.
