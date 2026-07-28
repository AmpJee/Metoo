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
├── lib/logger.ts       JSON lines in production, readable in dev
├── middleware/error.ts one error envelope for every route
├── modules/            one folder per domain
│   ├── health/         liveness + database probe
│   └── users/          SAMPLE — the pattern to copy, then delete
└── generated/          Prisma client — generated, gitignored
```

## Adding a module

Copy `modules/users/`. The shape:

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
- **Declare `response` schemas.** They are what make `/openapi` useful.
- **One PrismaClient.** Import it from `config/prisma.ts`; never construct another.

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
