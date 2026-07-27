/**
 * SAMPLE SEED — goes away with the sample User model.
 *
 * Uses upsert on the unique email so `make db-seed` is idempotent: running it
 * twice leaves the same three rows rather than failing on a duplicate key.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.ts'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — cannot seed.')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const users = [
  { email: 'admin@metoo.test', name: 'Platform Admin', role: 'ADMIN' as const },
  { email: 'brand@metoo.test', name: 'Sample Brand', role: 'BRAND' as const },
  {
    email: 'retailer@metoo.test',
    name: 'Sample Retailer',
    role: 'RETAILER' as const,
  },
]

for (const user of users) {
  await prisma.user.upsert({
    where: { email: user.email },
    update: { name: user.name, role: user.role },
    create: user,
  })
}

console.warn(`Seeded ${users.length} sample users.`)
await prisma.$disconnect()
