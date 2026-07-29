/**
 * Development seed: one account per role, plus a small catalog.
 *
 * Every write is an upsert keyed on a unique column, so running this twice
 * leaves the same rows rather than failing on a duplicate key. That matters
 * because `make db-seed` is the fastest way to get back to a known state.
 *
 * The passwords here are deliberately weak and the emails deliberately fake.
 * This script is for local development and must never run against production.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.ts'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — cannot seed.')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

/** Shared across every seeded account — local development only. */
const PASSWORD = 'password123'
const passwordHash = await Bun.password.hash(PASSWORD)

// --- admin -----------------------------------------------------------------

const admin = await prisma.user.upsert({
  where: { email: 'admin@metoo.test' },
  update: { passwordHash, role: 'ADMIN', status: 'APPROVED' },
  create: {
    email: 'admin@metoo.test',
    passwordHash,
    role: 'ADMIN',
    status: 'APPROVED',
  },
})

// --- brand -----------------------------------------------------------------

const brandUser = await prisma.user.upsert({
  where: { email: 'brand@metoo.test' },
  update: { passwordHash, role: 'BRAND', status: 'APPROVED' },
  create: {
    email: 'brand@metoo.test',
    passwordHash,
    role: 'BRAND',
    status: 'APPROVED',
  },
})

const brand = await prisma.brandProfile.upsert({
  where: { userId: brandUser.id },
  update: {},
  create: {
    userId: brandUser.id,
    name: 'Siam Craft Goods',
    description: 'Small-batch Thai household and pantry goods.',
    phone: '02-000-0000',
    addressLine: '119 Charoen Krung Road',
    province: 'Bangkok',
    postalCode: '10500',
    bankName: 'Kasikornbank',
    bankAccountName: 'Siam Craft Goods Co., Ltd.',
    bankAccountNumber: '000-0-00000-0',
  },
})

// --- retailer --------------------------------------------------------------

const retailerUser = await prisma.user.upsert({
  where: { email: 'retailer@metoo.test' },
  update: { passwordHash, role: 'RETAILER', status: 'APPROVED' },
  create: {
    email: 'retailer@metoo.test',
    passwordHash,
    role: 'RETAILER',
    status: 'APPROVED',
  },
})

const retailer = await prisma.retailerProfile.upsert({
  where: { userId: retailerUser.id },
  update: {},
  create: {
    userId: retailerUser.id,
    shopName: 'Somchai Minimart',
    phone: '02-111-1111',
    addressLine: '42 Sukhumvit Soi 31',
    province: 'Bangkok',
    postalCode: '10110',
  },
})

// An empty cart, so the checkout flow has something to attach to immediately.
await prisma.cart.upsert({
  where: { retailerId: retailer.id },
  update: {},
  create: { retailerId: retailer.id },
})

// --- a pending brand, to exercise the approval queue ------------------------

const pendingUser = await prisma.user.upsert({
  where: { email: 'pending-brand@metoo.test' },
  update: { passwordHash, role: 'BRAND', status: 'PENDING' },
  create: {
    email: 'pending-brand@metoo.test',
    passwordHash,
    role: 'BRAND',
    status: 'PENDING',
  },
})

await prisma.brandProfile.upsert({
  where: { userId: pendingUser.id },
  update: {},
  create: {
    userId: pendingUser.id,
    name: 'Chiang Mai Herbals',
    description: 'Awaiting document review — use this to test the admin queue.',
    phone: '053-000-000',
    addressLine: '8 Nimmanhaemin Road',
    province: 'Chiang Mai',
    postalCode: '50200',
  },
})

// --- catalog ---------------------------------------------------------------

// One product per category so commission tiering can be exercised end to end.
// Prices are in satang: 4500 == ฿45.00.
const products = [
  {
    name: 'Jasmine Rice Crackers 90g',
    category: 'FOOD_BEVERAGE' as const,
    unitPriceMinor: 4500,
    moq: 12,
    caseSize: 12,
    stockQty: 480,
  },
  {
    name: 'Coconut Soap Bar 100g',
    category: 'HEALTH_BEAUTY' as const,
    unitPriceMinor: 6500,
    moq: 24,
    caseSize: 6,
    stockQty: 300,
  },
  {
    name: 'Woven Rattan Basket',
    category: 'HOME_LIVING' as const,
    unitPriceMinor: 32000,
    moq: 6,
    caseSize: 2,
    stockQty: 60,
  },
]

for (const product of products) {
  // Products have no natural unique key, so upsert on a deterministic id
  // derived from the brand and name — otherwise reseeding duplicates them.
  const existing = await prisma.product.findFirst({
    where: { brandId: brand.id, name: product.name },
  })

  if (existing) {
    await prisma.product.update({ where: { id: existing.id }, data: product })
  } else {
    await prisma.product.create({ data: { ...product, brandId: brand.id } })
  }
}

console.warn(
  [
    'Seeded:',
    `  admin           ${admin.email}`,
    `  brand           ${brandUser.email} (${brand.name}, APPROVED)`,
    `  pending brand   ${pendingUser.email} (PENDING — for the approval queue)`,
    `  retailer        ${retailerUser.email} (${retailer.shopName})`,
    `  products        ${products.length}`,
    '',
    `  password for every account: ${PASSWORD}`,
  ].join('\n')
)

await prisma.$disconnect()
