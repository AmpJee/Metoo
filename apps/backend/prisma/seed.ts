/**
 * Development seed: one account per role, plus a small catalog.
 *
 * Every write is an upsert keyed on a unique column, so running this twice
 * leaves the same rows rather than failing on a duplicate key. That matters
 * because `make db-seed` is the fastest way to get back to a known state.
 *
 * "A known state" is why the profile upserts pass the same object to `update`
 * as to `create`. With `update: {}` the script only ever *creates* a profile —
 * re-running it after an edit leaves the edit in place, so the one command
 * documented as the way back to a clean slate quietly is not.
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
  update: { passwordHash, role: 'ADMIN', status: 'ONBOARDED' },
  create: {
    email: 'admin@metoo.test',
    passwordHash,
    role: 'ADMIN',
    status: 'ONBOARDED',
  },
})

// --- brand -----------------------------------------------------------------

const brandUser = await prisma.user.upsert({
  where: { email: 'brand@metoo.test' },
  update: { passwordHash, role: 'BRAND', status: 'ONBOARDED' },
  create: {
    email: 'brand@metoo.test',
    passwordHash,
    role: 'BRAND',
    status: 'ONBOARDED',
  },
})

const brandFields = {
  name: 'Siam Craft Goods',
  description: 'Small-batch Thai household and pantry goods.',
  phone: '02-000-0000',
  addressLine: '119 Charoen Krung Road',
  province: 'Bangkok',
  postalCode: '10500',
  bankName: 'Kasikornbank',
  bankAccountName: 'Siam Craft Goods Co., Ltd.',
  bankAccountNumber: '000-0-00000-0',
  // Spelled out rather than left to the column defaults. A field the seed does
  // not name is a field a re-run cannot put back, so anything an admin screen
  // can write has to appear here even when the intended value is empty.
  fdaStatus: 'YES',
  sizeBand: null,
  socialHandle: null,
  caseWeightKg: null,
  caseDimensionsCm: null,
  caseUnits: null,
  existingRetailerCount: null,
  referralSource: null,
  adminNotes: null,
} as const

const brand = await prisma.brandProfile.upsert({
  where: { userId: brandUser.id },
  update: brandFields,
  create: { userId: brandUser.id, ...brandFields },
})

// --- retailer --------------------------------------------------------------

const retailerUser = await prisma.user.upsert({
  where: { email: 'retailer@metoo.test' },
  update: { passwordHash, role: 'RETAILER', status: 'ONBOARDED' },
  create: {
    email: 'retailer@metoo.test',
    passwordHash,
    role: 'RETAILER',
    status: 'ONBOARDED',
  },
})

const retailerFields = {
  shopName: 'Somchai Minimart',
  phone: '02-111-1111',
  addressLine: '42 Sukhumvit Soi 31',
  province: 'Bangkok',
  postalCode: '10110',
  // Explicitly null, not omitted: a re-run has to clear one that was set, or
  // it is not restoring the seeded state. Same for every pipeline column below
  // — an admin screen can write them, so the seed has to be able to undo that.
  taxId: null,
  shopType: 'MINIMART',
  zone: null,
  socialHandle: null,
  currentProducts: null,
  monthlyCapacity: null,
  preferredPayment: null,
  paymentReliability: 'PENDING',
  deliveryWindow: null,
  referralSource: null,
  adminNotes: null,
} as const

const retailer = await prisma.retailerProfile.upsert({
  where: { userId: retailerUser.id },
  update: retailerFields,
  create: { userId: retailerUser.id, ...retailerFields },
})

// An empty cart, so the checkout flow has something to attach to immediately.
await prisma.cart.upsert({
  where: { retailerId: retailer.id },
  update: {},
  create: { retailerId: retailer.id },
})

// --- a prospect brand, to give the pipeline board something to work ---------

const pendingUser = await prisma.user.upsert({
  where: { email: 'pending-brand@metoo.test' },
  update: { passwordHash, role: 'BRAND', status: 'INTERESTED' },
  create: {
    email: 'pending-brand@metoo.test',
    passwordHash,
    role: 'BRAND',
    status: 'INTERESTED',
  },
})

const prospectFields = {
  name: 'Chiang Mai Herbals',
  description: 'Mid-pipeline — use this to exercise the admin board.',
  phone: '053-000-000',
  addressLine: '8 Nimmanhaemin Road',
  province: 'Chiang Mai',
  postalCode: '50200',
  // Blocked on อย. — the exact case the design's notes describe in prose.
  fdaStatus: 'PENDING',
  sizeBand: 'SIZE_1_5',
  socialHandle: '@cmherbals',
  existingRetailerCount: 5,
  referralSource: 'Instagram',
  adminNotes: 'Waiting on อย. cert before we list the soaps.',
  // A prospect has not given bank details yet — that is the point of it.
  bankName: null,
  bankAccountName: null,
  bankAccountNumber: null,
  caseWeightKg: null,
  caseDimensionsCm: null,
  caseUnits: null,
} as const

await prisma.brandProfile.upsert({
  where: { userId: pendingUser.id },
  update: prospectFields,
  create: { userId: pendingUser.id, ...prospectFields },
})

// --- catalog ---------------------------------------------------------------

// One product per category so commission tiering can be exercised end to end.
// Prices are in satang: 4500 == ฿45.00.
const products = [
  {
    name: 'Jasmine Rice Crackers 90g',
    category: 'FOOD_BEVERAGE' as const,
    pricePerPackMinor: 4500,
    minPacks: 12,
    unitsPerPack: 12,
    stockPacks: 480,
    description:
      'Thin jasmine rice crackers, lightly salted. Shelf-stable and steady on a counter display.',
    sku: 'JRC-090',
    // Real GTINs — the check digit is verified on write, so a made-up number
    // here would make the seed fail its own validation.
    barcode: '8850999320014',
    packWeightGrams: 1200,
    ingredients: 'Jasmine rice, palm oil, salt, cane sugar',
    shelfLifeDays: 270,
    // Every preset is >= minPacks (12), which the domain check enforces.
    packPresets: [12, 24, 48, 96],
  },
  {
    name: 'Coconut Soap Bar 100g',
    category: 'HEALTH_BEAUTY' as const,
    pricePerPackMinor: 6500,
    minPacks: 24,
    unitsPerPack: 6,
    stockPacks: 300,
    description:
      'Cold-pressed coconut oil soap, unscented. Sells well next to the till.',
    sku: 'CSB-100',
    barcode: '8851234567898',
    packWeightGrams: 700,
    ingredients: 'Coconut oil, water, sodium hydroxide, glycerin, coconut milk',
    shelfLifeDays: 1095,
    packPresets: [24, 48, 72, 120],
  },
  {
    name: 'Woven Rattan Basket',
    category: 'HOME_LIVING' as const,
    pricePerPackMinor: 32000,
    minPacks: 6,
    unitsPerPack: 2,
    stockPacks: 60,
    description:
      'Hand-woven rattan, two sizes nested. No two are identical, which is the point.',
    sku: 'WRB-001',
    // Deliberately empty: a handmade item is ordered on purpose, not by
    // tapping a shortcut. The frontend needs this case to build the
    // stepper-only layout against.
    packPresets: [],
    // No barcode and no shelf life either: a non-food handmade good genuinely
    // has neither, which keeps nulls in the seed for the frontend to render.
    packWeightGrams: 1800,
  },
  {
    // Min 6 packs at 5 units/pack: the exact shape that the old case-size
    // divisibility rule rejected, kept here as a regression guard.
    name: 'Slim Card Holder',
    category: 'FASHION_ACCESSORIES' as const,
    pricePerPackMinor: 149000,
    minPacks: 6,
    unitsPerPack: 5,
    stockPacks: 96,
    description:
      'Vegetable-tanned leather, four card slots. Ages rather than wears out.',
    sku: 'SCH-004',
    barcode: '036000291452',
    packWeightGrams: 450,
    packPresets: [6, 12, 24],
  },
]

for (const product of products) {
  // Products have no natural unique key, so match on brand + name — otherwise
  // reseeding duplicates them.
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
    `  brand           ${brandUser.email} (${brand.name}, ONBOARDED)`,
    `  prospect brand  ${pendingUser.email} (INTERESTED — for the pipeline board)`,
    `  retailer        ${retailerUser.email} (${retailer.shopName})`,
    `  products        ${products.length}`,
    '',
    `  password for every account: ${PASSWORD}`,
  ].join('\n')
)

await prisma.$disconnect()
