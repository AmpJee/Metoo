# Backend

Elysia API on Bun, Prisma v7 against Supabase Postgres.

```bash
make dev-backend   # http://localhost:3000, docs at /openapi
```

## Layout

```
src/
├── index.ts            app assembly + listen
├── config/
│   ├── env.ts          fail-fast environment validation
│   └── prisma.ts       the single PrismaClient (+ pg driver adapter)
├── lib/
│   ├── logger.ts       JSON lines in production, readable in dev
│   ├── jwt.ts          access + refresh token signing
│   ├── password.ts     argon2id via Bun.password
│   └── supabase.ts     Storage client + signed URLs
├── middleware/
│   ├── error.ts        one error envelope for every route
│   └── auth.ts         requireAccess — authentication, role, approval
├── modules/            one folder per domain
│   ├── health/         liveness + database probe
│   ├── auth/           register, login, refresh, logout, me
│   └── admin/          signup approval queue
└── generated/          Prisma client — generated, gitignored
```

Each module is a folder with `index.ts` (routes and schemas) and, once there is
real work to do, `service.ts` (the Prisma calls). Keeping them apart is what
lets the route file stay readable as a description of the API.

## Protecting a route

`requireAccess` resolves the caller and enforces role and approval in one pass.
It puts `auth` (`userId`, `role`, `status`) on the context.

```ts
new Elysia({ name: 'products', prefix: '/products' })
  .use(requireAccess({ roles: ['BRAND'], approved: true }))
  .get('/', ({ auth }) => listProductsForBrand(auth.userId))
```

`roles` and `approved` are separate on purpose. A `PENDING` brand is
authenticated and _is_ a brand — it just must not reach product management yet,
while still being able to load the screen that explains why. Admin routes set
`roles` only: admins are seeded, not approved.

## Adding a module

Copy `modules/auth/`. The shape:

```ts
export const productsModule = new Elysia({
  name: 'products',
  prefix: '/products',
})
  .get('/', () => prisma.product.findMany(), {
    detail: { summary: 'List products', tags: ['Products'] },
    response: { 200: t.Array(productResponse) },
  })
  .post('/', async ({ body, set }) => { ... }, {
    body: t.Object({ name: t.String({ minLength: 1 }) }),
  })
```

Then register it in `src/index.ts` with `.use(productsModule)`.

Four rules that keep the API predictable:

- **Validate at the edge.** A TypeBox schema on `body`/`params` means bad input
  is rejected with a 422 before any handler code runs.
- **Throw `AppError` for expected failures** — `new AppError(404, 'NOT_FOUND', msg)`.
  Anything else becomes a 500 and gets logged.
- **Declare `response` schemas.** They are what make `/openapi` useful — it is
  the contract the frontend team builds against.
- **One PrismaClient.** Import it from `config/prisma.ts`; never construct another.

## Auth

Tokens are carried in the `Authorization: Bearer` header, not cookies.

- **Access token** — 15 minutes, holds `role` and `status` so authorising a
  request costs no database round-trip. The frontend keeps it in
  `localStorage`, which is why the window is short.
- **Refresh token** — 30 days, stored **hashed** and **rotated on every use**.
  Replaying a used one fails, so a stolen token is good for at most one
  exchange.

Two consequences worth knowing:

- Because `status` is a token claim, an admin approving an account does not
  take effect until that user's access token is refreshed — up to 15 minutes,
  or immediately if they log in again.
- `/auth/login` succeeds for unapproved accounts by design; the frontend needs
  to sign them in to show them _why_ they are blocked. Route guards do the
  gating.

## Prisma v7 notes

Three things differ from v6 and will confuse anyone who has used it before:

1. **A driver adapter is required.** There is no bundled Rust query engine —
   `config/prisma.ts` wires up `PrismaPg`.
2. **`prisma-client`, not `prisma-client-js`.** The client is emitted as plain
   TypeScript into `src/generated/` (gitignored). Run `make db-generate` after
   every schema change.
3. **`.env` is not auto-loaded by the CLI.** Configuration lives in
   `prisma.config.ts`.

## Database URLs

`DATABASE_URL` (port 6543, pooled) is for the running app. `DIRECT_URL`
(port 5432, direct) is for the CLI — migrations use prepared statements and
advisory locks that the transaction pooler does not support. Details in the
root README.

## Migrations

```bash
make db-migrate    # create + apply during development
make db-deploy     # apply only — what Railway runs before each deploy
make db-seed
make db-reset      # DESTRUCTIVE, asks for confirmation
```
