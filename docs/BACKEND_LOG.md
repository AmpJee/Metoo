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

Storage is verified end to end against real Supabase: a signed URL is issued,
the file PUTs straight to the bucket, and confirming records it. A product photo
is readable at its public URL with no auth; a verification document is **not**
(400 without a signed URL) and opens only through the short-lived link admin
mints. The private bucket has no RLS policies at all — that absence is the
protection.

---

## Current state

- Merged through **PR #31**; `develop` green
- **~100 routes**, **23 models**, **186 domain unit tests**, no database in CI
- **One backend branch left unmerged: `feature/admin-table-parity`.**
  Everything else from the 3 Aug backlog is in.
- **The pitch is Mon 10 Aug 2026.** Deploying to Railway is still the critical
  path and had not started as of 4 Aug.

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
| #16 | `feature/uploads` | Photo + อย./ID uploads, signed URLs |
| #15, #17 | `docs/backend-log` | This file |
| #18 | `feature/commission` | Fashion & Accessories rate set to 800/500 |
| #19 | `fix/commission-tests` | Repaired the tests PR #18 left failing |

### History, continued

| PR | Branch | What it delivered |
| --- | --- | --- |
| #20 | `feature/social-and-storefront` | Save-for-later, follows, storefront, Customers, Feedback Log |
| #21 | `docs/log-update` | This file |
| #22 | `feature/client-site-page` | The retailer shop frontend |
| #23 | `feature/account-profile` | Retailer/brand profile self-edit, bank details |
| #24 | `feature/product-spec` | sku, barcode, weight, ingredients, shelf life, presets |
| #25 | `feature/chat` | Retailer ↔ brand chat |

### In flight

| Branch | State |
| --- | --- |
| `feature/admin-table-parity` | **The only unmerged backend branch.** 2 commits, green |
| `feature/admin-and-seller-side-page-` | Not mine — the seller and admin frontends, 7 admin and 9 seller pages |
| `frontend`, `feature/client-site-page` | Teammates' |

PRs #26–#31 merged the rest: commission docs, account management, product
images, create-with-images, dashboard parity, split login, pipeline seed data.

### Migration hazard

`prisma migrate diff --from-config-datasource` compares against the LIVE
database. Generating a migration from a branch that lacks another branch's
schema produces SQL that DROPS it. It fired twice on 3 Aug — once wanting to
drop `retailer_profiles.avatarUrl`, once wanting to drop the whole
`product_images` table and re-add `galleryUrls`. Both caught by reading the SQL
before applying, edited by hand, reason recorded in the migration file.
**Read every generated migration for unexpected `DROP` lines.**

### Why a new order "does not appear" on a brand dashboard

Asked on 4 Aug and investigated by placing a real order. **The backend is
correct.** Two things cause the confusion:

1. **An order belongs to the brand that owns the product.** The seed now has
   eight brands with catalogs, so ordering an EnerPhère product and then looking
   at Siam Craft Goods' dashboard shows nothing. Verified both ways: the order
   appeared on EnerPhère's dashboard and not on Siam Craft's.
2. **A PENDING order does not move the Revenue or Orders tiles.** Those read
   `EARNS_REVENUE` (CONFIRMED onward) through `loadOrderFacts` — a request is
   not a sale. It *does* immediately increment `store.newOrders`, sit top of
   `recentOrders`, and appear in `/brand/orders` and `/brand/orders/counts`.

Measured on a real checkout: newOrders 1→2, the new order first in
recentOrders, `/brand/orders` 12→13, counts.PENDING 1→2, while orderCount and
revenueMinor correctly did not move.

If a *confirmed* order is genuinely missing, check the frontend cache before
the API — Next caches server components aggressively.

### Demo data

`make db-seed` then `make db-demo`.

The seed creates the fixed accounts plus a full pipeline board — 10 retailers
and 9 brands using the names from the Figma prototypes, every column populated,
every filter tab non-empty. `db-demo` adds 90 orders over four months with
reviews, follows and wallet rows.

`db-demo` is idempotent by tagging: its orders are numbered `MT-DEMO-nnnn` and
a re-run deletes exactly those. Hand-placed test orders keep the normal
`MT-YYMMDD-` format and survive. A fixed-seed PRNG keeps the numbers identical
between runs, so a figure quoted in a rehearsal is the figure on the day.

Two traps it exists to avoid, both found by reading the output rather than
trusting it:

- a hand-made test product priced at **฿900,000 a pack** put one brand at ฿29M
  GMV against ฿300k for everyone else. Order generation now skips anything
  above ฿10,000 a pack.
- **"average signup → first order" came out at −108 days**, because orders are
  backdated but seeded accounts are created today. Signup dates are moved ahead
  of each account's first order on BOTH the user and the profile row — the
  admin table reads one and that metric reads the other.

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

**`FASHION_ACCESSORIES` is 800/500 bps**, matching Health & Beauty (PR #18).
That category exists only in the design, so no rate came from the brief; it was
set to match because both are discretionary, higher-margin goods rather than
the staples a minimart restocks weekly.

There are no open commercial questions left.

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

**Changing a value in `src/domain/` almost always means changing its test.**
That layer is where the real coverage is. PR #18 changed the Fashion &
Accessories rate and shipped without touching `commission.test.ts`, leaving
`develop` red until PR #19. Run `bun run test` before opening a PR, and read
the count rather than trusting a chained shell command — `&&` on a lint step
will happily carry on past a failing test suite.

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

The backend is functionally complete. Everything below is either someone else's
job or a decision nobody has made yet.

### Blocking, and not mine to do

**Deploy to Railway.** Both `railway.json` files exist and CI builds both
images, but nothing has ever run outside a laptop. This is the critical path to
the 10 Aug pitch and needs the account owner: create the project, set the
thirteen backend env vars, then the migrations and a full live pass can run.
Two traps — `DATABASE_URL` is the pooled 6543 and `DIRECT_URL` the direct 5432,
and `CORS_ORIGIN` must be the deployed frontend origin.

**Merge the seven branches.** See "In flight". The migration hazard above
disappears once they land.

### Small backend items, none blocking

| Item | Note |
| --- | --- |
| Barcode search | The index exists; `?q=` does not search it |
| Retailer verification documents | `VerificationDocument.retailerId` exists, no route uses it — dead schema or a missing feature |
| Retailer cancelling own order | Today only BRAND and ADMIN can |

### Decisions nobody has made

These appear in the Figma prototypes with no backend behind them. Designing or
building more of them before a decision is wasted work.

1. **Contracts** — `CT-SEN-2026`, units fulfilled, "Nett 30 payment terms"
2. **Product variations** — colour variants throughout the marketplace
3. **MeCoins** — a loyalty currency in the cart
4. **Voucher codes** — shop vouchers in the cart
5. **Multiple delivery addresses** — Home/Work labels and a default; the
   backend stores exactly one
6. **Feedback types** — the admin log shows Compliment / Complaint / Decline /
   Churn; `Feedback` has no type field. Deliberate at the time, and the design
   disagrees
7. **Brand category, one or many** — `feature/admin-table-parity` adds a single
   `BrandProfile.category` because the Sellers table shows one per brand, while
   the summary chart derives categories from products. If one-per-brand is
   right the derivation should go

### Frontend, owned by teammates

`feature/admin-and-seller-side-page-` has the seller and admin apps. Two
environment problems will bite anyone starting it:

- `recharts` is in `package.json` but was not installed — `bun install` fixes
  the 500s on every admin page
- `next dev` panics with *"Invalid distDirRoot"* because
  `outputFileTracingRoot` in `next.config.ts` points above the project, which
  Turbopack refuses in dev. Setting it only for production builds fixes it

Also outstanding: `gh` is not authenticated on this machine, so PRs are opened
by hand.
