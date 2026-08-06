/**
 * The single PrismaClient for the process.
 *
 * Prisma v7 requires a driver adapter for every database — there is no longer
 * a built-in Rust query engine. For PostgreSQL that means `PrismaPg`.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.ts'
import { env, isProduction } from './env.ts'

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

export const prisma = new PrismaClient({
  adapter,
  log: isProduction ? ['error'] : ['warn', 'error'],
})

/** Cheap round-trip used by the /health endpoint to prove the DB is reachable. */
export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
