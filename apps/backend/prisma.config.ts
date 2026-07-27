// Prisma v7 no longer auto-loads .env, so we load it explicitly.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// DIRECT_URL, not DATABASE_URL: migrations need a direct session connection
// (Supabase port 5432). The transaction pooler (6543) does not support the
// prepared statements and advisory locks that `migrate` relies on.
//
// The fallback exists because `prisma generate` loads this file but never
// opens a connection — and generate has to work with no .env at all, during
// `docker build` and in CI. Prisma's own `env()` helper resolves eagerly and
// would throw there. Any command that does touch the database fails with a
// connection error naming this host, which says plainly what went wrong.
const PLACEHOLDER =
  'postgresql://placeholder@set-DIRECT_URL-in-your-env.invalid:5432/placeholder'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun run prisma/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? PLACEHOLDER,
  },
})
