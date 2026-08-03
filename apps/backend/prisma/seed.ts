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
  zone: 'Mueang / Nimman',
  socialHandle: '@somchaimart',
  currentProducts: 'Snacks, Beverages',
  monthlyCapacity: 40,
  preferredPayment: 'PROMPTPAY',
  paymentReliability: 'ON_TIME',
  deliveryWindow: 'Tue AM',
  referralSource: 'Baan Rai Coffee',
  adminNotes: 'Reliable payer, wants weekly restock.',
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

// --- the rest of the pipeline board -----------------------------------------
//
// Every column of the admin Sellers and Retailers tables needs a row to show,
// and every filter tab needs something behind it. These accounts exist only to
// populate the console: they own no products and place no orders, so they
// cannot skew a dashboard figure.
//
// Passwords are the shared development one, same as every account above.

const pipelineRetailers = [
  {
    email: 'panoi@metoo.test',
    status: 'ONBOARDED' as const,
    shopName: 'Pa Noi Sundries',
    phone: '089-441-8890',
    addressLine: '12 Mae Sai Road',
    province: 'Chiang Rai',
    postalCode: '57130',
    shopType: 'SUNDRIES' as const,
    zone: 'Mae Sai',
    socialHandle: '@panoi',
    currentProducts: 'Household, Snacks',
    monthlyCapacity: 22,
    preferredPayment: 'CASH' as const,
    paymentReliability: 'PENDING' as const,
    deliveryWindow: 'Thu PM',
    referralSource: 'Word of mouth',
    adminNotes: 'Cash delivery only, small orders.',
  },
  {
    email: 'cornerdeli@metoo.test',
    status: 'ONBOARDED' as const,
    shopName: 'The Corner Deli',
    phone: '02-556-7788',
    addressLine: '9 Thonglor Soi 5',
    province: 'Bangkok',
    postalCode: '10110',
    shopType: 'SPECIALTY' as const,
    zone: 'Watthana / Thonglor',
    socialHandle: '@cornerdeli',
    currentProducts: 'Premium F&B',
    monthlyCapacity: 65,
    preferredPayment: 'CARD' as const,
    paymentReliability: 'ON_TIME' as const,
    deliveryWindow: 'Mon AM',
    referralSource: 'Klong Toey Snacks',
    adminNotes: 'High GMV, curated shelf.',
  },
  {
    email: 'baansuan@metoo.test',
    status: 'ONBOARDED' as const,
    shopName: 'Baan Suan Grocery',
    phone: '083-220-9911',
    addressLine: '55 Mueang Road',
    province: 'Khon Kaen',
    postalCode: '40000',
    shopType: 'MINIMART' as const,
    zone: 'Mueang',
    socialHandle: '@baansuan',
    currentProducts: 'Groceries, Sauces',
    monthlyCapacity: 30,
    preferredPayment: 'PROMPTPAY' as const,
    // The one late payer, so the console has a red badge to render.
    paymentReliability: 'LATE' as const,
    deliveryWindow: 'Wed AM',
    referralSource: 'Isaan Gold Sauce',
    adminNotes: 'Late on invoices — watch credit.',
  },
  {
    email: 'seaside@metoo.test',
    status: 'INTERESTED' as const,
    shopName: 'Seaside Mart',
    phone: '088-119-3345',
    addressLine: '3 Patong Beach Road',
    province: 'Phuket',
    postalCode: '83150',
    shopType: 'MINIMART' as const,
    zone: 'Patong',
    socialHandle: '@seasidemart',
    currentProducts: 'Toiletries, Snacks',
    monthlyCapacity: 18,
    preferredPayment: 'CARD' as const,
    paymentReliability: 'PENDING' as const,
    deliveryWindow: 'Fri AM',
    referralSource: 'Instagram',
    adminNotes: 'Seasonal tourist traffic.',
  },
  {
    email: 'nimmangift@metoo.test',
    status: 'CONTACTED' as const,
    shopName: 'Nimman Gift Studio',
    phone: '086-334-7781',
    addressLine: '21 Nimmanhaemin Soi 9',
    province: 'Chiang Mai',
    postalCode: '50200',
    shopType: 'SPECIALTY' as const,
    zone: 'Mueang / Nimman',
    socialHandle: '@nimmangift',
    currentProducts: 'Home décor, Gifts',
    monthlyCapacity: 25,
    preferredPayment: 'PROMPTPAY' as const,
    paymentReliability: 'ON_TIME' as const,
    deliveryWindow: 'Sat AM',
    referralSource: 'Facebook',
    adminNotes: 'Wants Home & Living brands.',
  },
  {
    email: 'warorot@metoo.test',
    status: 'NOT_CONTACTED' as const,
    shopName: 'Talat Warorot Shop 12',
    phone: '081-990-2244',
    addressLine: 'Warorot Market, Old City',
    province: 'Chiang Mai',
    postalCode: '50100',
    shopType: 'MARKET_STALL' as const,
    zone: 'Old City',
    socialHandle: '@warorot12',
    currentProducts: 'Dry goods',
    monthlyCapacity: 12,
    preferredPayment: 'CASH' as const,
    paymentReliability: 'PENDING' as const,
    deliveryWindow: 'Tue AM',
    referralSource: 'Walk-in',
    adminNotes: 'Small stall, price sensitive.',
  },
  {
    email: 'greenlife@metoo.test',
    status: 'DECLINED' as const,
    shopName: 'Green Life Organics',
    phone: '02-777-1122',
    addressLine: '77 Ari Soi 4',
    province: 'Bangkok',
    postalCode: '10400',
    shopType: 'SPECIALTY' as const,
    zone: 'Phaya Thai / Ari',
    socialHandle: '@greenlifeorganics',
    currentProducts: 'Organic dry goods',
    monthlyCapacity: 20,
    preferredPayment: 'CARD' as const,
    paymentReliability: 'PENDING' as const,
    deliveryWindow: 'Thu AM',
    referralSource: 'Trade fair',
    adminNotes: 'Locked into their current wholesaler.',
  },
]

for (const row of pipelineRetailers) {
  const { email, status, ...profile } = row

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'RETAILER', status },
    create: { email, passwordHash, role: 'RETAILER', status },
  })

  await prisma.retailerProfile.upsert({
    where: { userId: user.id },
    update: { ...profile, taxId: null },
    create: { userId: user.id, ...profile, taxId: null },
  })

  await prisma.cart.upsert({
    where: {
      retailerId: (
        await prisma.retailerProfile.findUniqueOrThrow({
          where: { userId: user.id },
          select: { id: true },
        })
      ).id,
    },
    update: {},
    create: {
      retailerId: (
        await prisma.retailerProfile.findUniqueOrThrow({
          where: { userId: user.id },
          select: { id: true },
        })
      ).id,
    },
  })
}

const pipelineBrands = [
  {
    email: 'baanrai@metoo.test',
    status: 'ONBOARDED' as const,
    name: 'Baan Rai Coffee',
    description: 'Single-origin beans and drip bags from Chiang Mai.',
    phone: '081-234-5566',
    addressLine: '4 Huay Kaew Road',
    province: 'Chiang Mai',
    postalCode: '50300',
    fdaStatus: 'YES' as const,
    sizeBand: 'SIZE_6_20' as const,
    socialHandle: '@baanrai',
    caseWeightKg: 5.2,
    caseDimensionsCm: '30x20x18 cm',
    caseUnits: 24,
    existingRetailerCount: 14,
    referralSource: 'Instagram',
    adminNotes: 'Strong repeat demand, wants EDI for restock.',
  },
  {
    email: 'klongtoey@metoo.test',
    status: 'ONBOARDED' as const,
    name: 'Klong Toey Snacks',
    description: 'Mixed snack cases for convenience shelves.',
    phone: '02-119-4477',
    addressLine: '88 Rama IV Road',
    province: 'Bangkok',
    postalCode: '10110',
    fdaStatus: 'YES' as const,
    sizeBand: 'SIZE_21_50' as const,
    socialHandle: '@ktsnacks',
    caseWeightKg: 7.8,
    caseDimensionsCm: '40x30x22 cm',
    caseUnits: 48,
    existingRetailerCount: 62,
    referralSource: 'Trade fair',
    adminNotes: 'Biggest catalog so far. Priority account.',
  },
  {
    email: 'isaangold@metoo.test',
    status: 'ONBOARDED' as const,
    name: 'Isaan Gold Sauce',
    description: 'Nam jim and chilli sauces, family recipe.',
    phone: '083-441-9987',
    addressLine: '19 Mittraphap Road',
    province: 'Khon Kaen',
    postalCode: '40000',
    fdaStatus: 'YES' as const,
    sizeBand: 'SIZE_6_20' as const,
    socialHandle: '@isaangold',
    caseWeightKg: 9.6,
    caseDimensionsCm: '36x28x26 cm',
    caseUnits: 24,
    existingRetailerCount: 28,
    referralSource: 'Referral (Klong Toey)',
    adminNotes: 'Fast growth, needs pallet logistics.',
  },
  {
    email: 'suansuk@metoo.test',
    status: 'INTERESTED' as const,
    name: 'Suan Suk Herbal',
    description: 'Herbal balms and soaps.',
    phone: '089-887-2210',
    addressLine: '6 Phahonyothin Road',
    province: 'Chiang Rai',
    postalCode: '57000',
    fdaStatus: 'PENDING' as const,
    sizeBand: 'SIZE_1_5' as const,
    socialHandle: '@suansuk',
    caseWeightKg: 3.0,
    caseDimensionsCm: '24x16x14 cm',
    caseUnits: 12,
    existingRetailerCount: 5,
    referralSource: 'Referral (Baan Rai)',
    adminNotes: 'Waiting on อย. cert before we list soaps.',
  },
  {
    email: 'phuketsea@metoo.test',
    status: 'INTERESTED' as const,
    name: 'Phuket Sea Soap',
    description: 'Sea-salt soap bars for tourist shelves.',
    phone: '088-220-7714',
    addressLine: '14 Thalang Road',
    province: 'Phuket',
    postalCode: '83000',
    fdaStatus: 'PENDING' as const,
    sizeBand: 'SIZE_1_5' as const,
    socialHandle: '@seasoap',
    caseWeightKg: 2.1,
    caseDimensionsCm: '22x18x12 cm',
    caseUnits: 20,
    existingRetailerCount: 8,
    referralSource: 'Instagram',
    adminNotes: 'Tourist-market brand, seasonal volume.',
  },
  {
    email: 'lannascent@metoo.test',
    status: 'CONTACTED' as const,
    name: 'Lanna Home Scent',
    description: 'Handmade reed diffusers.',
    phone: '086-556-1290',
    addressLine: '30 Suthep Road',
    province: 'Chiang Mai',
    postalCode: '50200',
    fdaStatus: 'NO' as const,
    sizeBand: 'SIZE_1_5' as const,
    socialHandle: '@lannascent',
    caseWeightKg: 4.4,
    caseDimensionsCm: '28x28x20 cm',
    caseUnits: 16,
    existingRetailerCount: 3,
    referralSource: 'Facebook ad',
    adminNotes: 'Handmade reed diffusers, needs photos.',
  },
  {
    email: 'nanweave@metoo.test',
    status: 'DECLINED' as const,
    name: 'Nan Weave Textiles',
    description: 'Hand-woven throws.',
    phone: '085-993-4402',
    addressLine: '2 Suriyaphong Road',
    province: 'Nan',
    postalCode: '55000',
    fdaStatus: 'NO' as const,
    sizeBand: 'SIZE_6_20' as const,
    socialHandle: '@nanweave',
    caseWeightKg: 6.0,
    caseDimensionsCm: '45x30x25 cm',
    caseUnits: 10,
    existingRetailerCount: 11,
    referralSource: 'Word of mouth',
    adminNotes: 'Wholesale margins too thin for them. Revisit in Q4.',
  },
]

for (const row of pipelineBrands) {
  const { email, status, ...profile } = row

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'BRAND', status },
    create: { email, passwordHash, role: 'BRAND', status },
  })

  // No bank details: none of these has requested a payout, and leaving them
  // null keeps the "brand must add bank details first" path reachable.
  const bank = {
    bankName: null,
    bankAccountName: null,
    bankAccountNumber: null,
  }

  await prisma.brandProfile.upsert({
    where: { userId: user.id },
    update: { ...profile, ...bank },
    create: { userId: user.id, ...profile, ...bank },
  })
}

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
