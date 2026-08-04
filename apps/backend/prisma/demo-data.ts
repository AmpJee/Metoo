/**
 * Demo trading history — products, orders, reviews, follows and wallet rows.
 *
 * Separate from seed.ts because it answers a different question. The seed
 * creates the fixed accounts a developer logs in as; this creates the *volume*
 * a dashboard needs to look like a business rather than a test fixture. Repeat
 * rate, GMV by brand, fulfilment time and the revenue chart are all meaningless
 * over four products and no orders.
 *
 * Idempotent by tagging: every order it creates has an orderNumber starting
 * `MT-DEMO-`, and a re-run deletes exactly those before rebuilding. Orders
 * placed by hand while testing keep the normal `MT-YYMMDD-` format and are
 * never touched.
 *
 * Deterministic: a fixed-seed PRNG, so re-running gives the same numbers and a
 * figure quoted in a rehearsal is still there on the day.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.ts'
import { resolveCommissionBps, splitAmount } from '../src/domain/commission.ts'
import type { Category, OrderStatus } from '../src/generated/prisma/client.ts'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set.')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const DEMO_PREFIX = 'MT-DEMO-'

/**
 * Mulberry32. Not for anything security-related — the point is only that two
 * runs produce identical data, so a number seen in a rehearsal is the number
 * on the day.
 */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = rng(20260810)
const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(random() * items.length)]!
const between = (min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1))

const DAY = 86_400_000

/** ฿10,000 a pack. Above this it is a typo or a test row, not a product. */
const MAX_DEMO_PRICE_MINOR = 1_000_000

// --- catalog -----------------------------------------------------------------

/**
 * Products for the brands the pipeline seed created without any.
 *
 * A brand with no products cannot appear in GMV-by-brand or the category
 * breakdown, so the admin charts would show a single bar.
 */
const CATALOG: Record<
  string,
  Array<{
    name: string
    category: Category
    pricePerPackMinor: number
    minPacks: number
    unitsPerPack: number
    stockPacks: number
    description?: string
    ingredients?: string
    packWeightGrams?: number
    shelfLifeDays?: number
  }>
> = {
  // --- real products, details read off their own packaging -----------------
  EnerPhère: [
    {
      name: 'Protein Ball — Cocoa 125g',
      category: 'FOOD_BEVERAGE',
      pricePerPackMinor: 19000,
      minPacks: 12,
      unitsPerPack: 6,
      stockPacks: 180,
      description:
        'ธัญพืชผสมอินทผลัมและโปรตีนถั่วเหลือง — 35 g protein a box, sweetened only by dates, gluten free. Slow-release energy, keeps you full.',
      ingredients: 'Cereal grains, dates, soy protein, cocoa, sesame',
      packWeightGrams: 750,
      shelfLifeDays: 270,
    },
  ],
  'Lamune.': [
    {
      name: 'Morning Brief Eau de Parfum 30ml',
      category: 'HEALTH_BEAUTY',
      pricePerPackMinor: 89000,
      minPacks: 6,
      unitsPerPack: 1,
      stockPacks: 48,
      description:
        'Top notes white tea and sea water; heart of iris and fern; base of maté and cedar wood. 30 ml, concrete-finish box.',
      packWeightGrams: 320,
      shelfLifeDays: 1095,
    },
  ],
  SENTIRA: [
    {
      name: 'Embossed Card Holder',
      category: 'FASHION_ACCESSORIES',
      pricePerPackMinor: 69000,
      minPacks: 6,
      unitsPerPack: 1,
      stockPacks: 72,
      description:
        'Burgundy leather with an embossed lily, brass zip, four card slots. Ages rather than wears out.',
      packWeightGrams: 120,
    },
  ],
  'ย่าจ๋า (Yajaa)': [
    {
      name: 'น้ำพริกเห็ดนางฟ้ากรอบ 120g',
      category: 'FOOD_BEVERAGE',
      pricePerPackMinor: 12000,
      minPacks: 12,
      unitsPerPack: 12,
      stockPacks: 240,
      description:
        'น้ำพริกเห็ดนางฟ้ากรอบ ย่าจ๋า — crispy oyster-mushroom chilli paste, อย. certified. อร่อยกลมกล่อมในทุกคำ.',
      ingredients:
        'Oyster mushroom, dried chilli, shallot, garlic, palm sugar, fish sauce, salt',
      packWeightGrams: 1600,
      shelfLifeDays: 365,
    },
  ],
  'Baan Rai Coffee': [
    {
      name: 'Drip Bag Box 10s',
      category: 'FOOD_BEVERAGE',
      pricePerPackMinor: 32000,
      minPacks: 6,
      unitsPerPack: 10,
      stockPacks: 240,
    },
    {
      name: 'House Blend Beans 250g',
      category: 'FOOD_BEVERAGE',
      pricePerPackMinor: 42000,
      minPacks: 6,
      unitsPerPack: 1,
      stockPacks: 180,
    },
    {
      name: 'Cold Brew Concentrate 500ml',
      category: 'FOOD_BEVERAGE',
      pricePerPackMinor: 45000,
      minPacks: 12,
      unitsPerPack: 1,
      stockPacks: 90,
    },
  ],
  'Klong Toey Snacks': [
    {
      name: 'Seaweed Crisp 25g',
      category: 'FOOD_BEVERAGE',
      pricePerPackMinor: 15000,
      minPacks: 24,
      unitsPerPack: 12,
      stockPacks: 600,
    },
    {
      name: 'Mixed Snack Case',
      category: 'FOOD_BEVERAGE',
      pricePerPackMinor: 29500,
      minPacks: 12,
      unitsPerPack: 48,
      stockPacks: 320,
    },
    {
      name: 'Tamarind Chew 80g',
      category: 'FOOD_BEVERAGE',
      pricePerPackMinor: 9500,
      minPacks: 24,
      unitsPerPack: 20,
      stockPacks: 8,
    },
  ],
  'Isaan Gold Sauce': [
    {
      name: 'Nam Jim Jaew 300ml',
      category: 'FOOD_BEVERAGE',
      pricePerPackMinor: 28000,
      minPacks: 12,
      unitsPerPack: 24,
      stockPacks: 210,
    },
    {
      name: 'Roasted Chilli Paste 200g',
      category: 'FOOD_BEVERAGE',
      pricePerPackMinor: 24000,
      minPacks: 12,
      unitsPerPack: 24,
      stockPacks: 150,
    },
    {
      name: 'Premium Fish Sauce 700ml',
      category: 'FOOD_BEVERAGE',
      pricePerPackMinor: 41000,
      minPacks: 12,
      unitsPerPack: 24,
      stockPacks: 96,
    },
  ],
  'Suan Suk Herbal': [
    {
      name: 'Herbal Balm 20g',
      category: 'HEALTH_BEAUTY',
      pricePerPackMinor: 18000,
      minPacks: 12,
      unitsPerPack: 12,
      stockPacks: 140,
    },
    {
      name: 'Lemongrass Soap 100g',
      category: 'HEALTH_BEAUTY',
      pricePerPackMinor: 14000,
      minPacks: 24,
      unitsPerPack: 6,
      stockPacks: 0,
    },
  ],
  'Lanna Home Scent': [
    {
      name: 'Reed Diffuser 100ml',
      category: 'HOME_LIVING',
      pricePerPackMinor: 39000,
      minPacks: 6,
      unitsPerPack: 4,
      stockPacks: 60,
    },
  ],
  'Nan Weave Textiles': [
    {
      name: 'Hand-woven Throw',
      category: 'HOME_LIVING',
      pricePerPackMinor: 95000,
      minPacks: 4,
      unitsPerPack: 2,
      stockPacks: 24,
    },
  ],
}

/**
 * Where each status sits in the lifecycle, so timestamps can be filled in for
 * every step an order has already passed through. An order that is DELIVERED
 * with no confirmedAt would break fulfilment-time maths.
 */
const STEP: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY_FOR_PICKUP: 3,
  PICKED_UP: 4,
  DELIVERED: 5,
  SETTLED: 6,
}

/** Weighted so most orders are finished — a board of PENDING looks abandoned. */
const STATUS_MIX: OrderStatus[] = [
  ...Array<OrderStatus>(14).fill('SETTLED'),
  ...Array<OrderStatus>(5).fill('DELIVERED'),
  ...Array<OrderStatus>(3).fill('PICKED_UP'),
  ...Array<OrderStatus>(2).fill('READY_FOR_PICKUP'),
  ...Array<OrderStatus>(3).fill('PREPARING'),
  ...Array<OrderStatus>(3).fill('CONFIRMED'),
  ...Array<OrderStatus>(3).fill('PENDING'),
  'CANCELLED',
]

async function main() {
  // --- clear only what this script owns -------------------------------------
  const previous = await prisma.order.findMany({
    where: { orderNumber: { startsWith: DEMO_PREFIX } },
    select: { id: true },
  })
  const previousIds = previous.map((o) => o.id)

  if (previousIds.length > 0) {
    // Wallet rows are append-only in the running application; this is seed
    // data in a development database, and leaving orphaned credits behind
    // would make every balance wrong on the next run.
    await prisma.walletTransaction.deleteMany({
      where: { orderId: { in: previousIds } },
    })
    await prisma.review.deleteMany({ where: { orderId: { in: previousIds } } })
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: previousIds } },
    })
    await prisma.order.deleteMany({ where: { id: { in: previousIds } } })
  }
  console.log(`  cleared ${previousIds.length} previous demo orders`)

  // --- products for the brands that have none -------------------------------
  let productsCreated = 0
  for (const [brandName, items] of Object.entries(CATALOG)) {
    const brand = await prisma.brandProfile.findFirst({
      where: { name: brandName },
      select: { id: true },
    })
    if (!brand) continue

    for (const item of items) {
      const existing = await prisma.product.findFirst({
        where: { brandId: brand.id, name: item.name },
        select: { id: true },
      })
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data: item })
      } else {
        await prisma.product.create({ data: { ...item, brandId: brand.id } })
        productsCreated++
      }
    }
  }
  console.log(`  ${productsCreated} products created`)

  // --- orders ---------------------------------------------------------------
  const brands = await prisma.brandProfile.findMany({
    where: { user: { status: 'ONBOARDED' }, products: { some: {} } },
    select: {
      id: true,
      products: {
        where: {
          isActive: true,
          // Keeps hand-made test products out of the demo. One priced at
          // ฿900,000 a pack turned a single order into more GMV than the rest
          // of the platform combined and made every chart useless.
          pricePerPackMinor: { lte: MAX_DEMO_PRICE_MINOR },
        },
        select: {
          id: true,
          name: true,
          pricePerPackMinor: true,
          unitsPerPack: true,
          minPacks: true,
          category: true,
        },
      },
    },
  })

  const retailers = await prisma.retailerProfile.findMany({
    where: { user: { status: 'ONBOARDED' } },
    select: {
      id: true,
      shopName: true,
      phone: true,
      addressLine: true,
      province: true,
      postalCode: true,
    },
  })

  if (brands.length === 0 || retailers.length === 0) {
    throw new Error(
      'Run `make db-seed` first — no onboarded brands or retailers.'
    )
  }

  const now = Date.now()
  const WINDOW_DAYS = 120
  const ORDER_COUNT = 90

  // Commission is tiered on the brand's trailing-month volume, so it has to be
  // counted as orders are laid down rather than applied uniformly afterwards.
  const monthlyCount = new Map<string, number[]>()

  let created = 0
  const settledForWallet: Array<{
    brandId: string
    orderId: string
    subtotalMinor: number
    commissionMinor: number
    at: Date
  }> = []
  const deliveredForReview: Array<{
    orderId: string
    retailerId: string
    productIds: string[]
    at: Date
  }> = []

  for (let i = 0; i < ORDER_COUNT; i++) {
    const brand = pick(brands)
    if (brand.products.length === 0) continue
    const retailer = pick(retailers)

    // Skewed towards recent so the week and month views are not empty.
    const daysAgo = Math.floor(Math.pow(random(), 1.6) * WINDOW_DAYS)
    const createdAt = new Date(now - daysAgo * DAY - between(0, 20) * 3_600_000)

    const status =
      // Anything placed in the last few days has not had time to settle.
      daysAgo < 3
        ? pick(['PENDING', 'CONFIRMED', 'PREPARING'] as OrderStatus[])
        : pick(STATUS_MIX)

    const lineCount = between(1, Math.min(3, brand.products.length))
    const chosen = [...brand.products]
      .sort(() => random() - 0.5)
      .slice(0, lineCount)

    const items = chosen.map((p) => {
      const packs = p.minPacks * between(1, 4)
      return {
        productId: p.id,
        // Snapshots, exactly as checkout writes them: a later rename or
        // repackage must not rewrite what this order said at the time.
        productName: p.name,
        pricePerPackMinor: p.pricePerPackMinor,
        unitsPerPack: p.unitsPerPack,
        packs,
        lineTotalMinor: p.pricePerPackMinor * packs,
      }
    })

    const subtotalMinor = items.reduce((sum, l) => sum + l.lineTotalMinor, 0)

    const month = Math.floor(daysAgo / 30)
    const counts = monthlyCount.get(brand.id) ?? []
    counts[month] = (counts[month] ?? 0) + 1
    monthlyCount.set(brand.id, counts)

    const commissionBps = resolveCommissionBps(
      chosen[0]!.category,
      counts[month]! - 1
    )
    const { commissionMinor, payoutMinor } = splitAmount(
      subtotalMinor,
      commissionBps
    )

    const step = STEP[status] ?? 0
    const at = (offsetHours: number) =>
      new Date(createdAt.getTime() + offsetHours * 3_600_000)

    const order = await prisma.order.create({
      data: {
        orderNumber: `${DEMO_PREFIX}${String(i + 1).padStart(4, '0')}`,
        checkoutGroupId: crypto.randomUUID(),
        retailerId: retailer.id,
        brandId: brand.id,
        status,
        subtotalMinor,
        totalMinor: subtotalMinor,
        commissionBps,
        commissionMinor,
        payoutMinor,
        paymentMethod: pick(['PROMPTPAY', 'CARD', 'CASH'] as const),
        // Admin fills this in after the fact; most orders have it, which is
        // what makes contribution margin a real number.
        deliveryCostMinor: status === 'PENDING' ? 0 : between(26, 48) * 1000,
        shippingAddress: {
          shopName: retailer.shopName,
          phone: retailer.phone,
          addressLine: retailer.addressLine,
          province: retailer.province,
          postalCode: retailer.postalCode,
        },
        confirmedAt: step >= 1 ? at(between(1, 6)) : null,
        readyForPickupAt: step >= 3 ? at(between(8, 20)) : null,
        pickedUpAt: step >= 4 ? at(between(20, 30)) : null,
        deliveredAt: step >= 5 ? at(between(24, 52)) : null,
        settledAt: step >= 6 ? at(between(56, 96)) : null,
        createdAt,
        items: { create: items },
      },
      select: { id: true, deliveredAt: true, settledAt: true },
    })
    created++

    if (status === 'SETTLED') {
      settledForWallet.push({
        brandId: brand.id,
        orderId: order.id,
        subtotalMinor,
        commissionMinor,
        at: order.settledAt ?? createdAt,
      })
    }
    if (step >= 5) {
      deliveredForReview.push({
        orderId: order.id,
        retailerId: retailer.id,
        productIds: chosen.map((p) => p.id),
        at: order.deliveredAt ?? createdAt,
      })
    }
  }
  console.log(`  ${created} orders created`)

  // --- make signups predate their orders ------------------------------------
  //
  // Seeded accounts are created today, but the orders above are backdated up
  // to four months. Left alone, "average signup → first order" comes out
  // NEGATIVE on the admin dashboard, which is both wrong and the kind of
  // number someone notices in a pitch. Each account is moved to a plausible
  // interval before its own first order.
  const firstOrderPerRetailer = await prisma.order.groupBy({
    by: ['retailerId'],
    _min: { createdAt: true },
  })

  for (const row of firstOrderPerRetailer) {
    const first = row._min.createdAt
    if (!first) continue

    const profile = await prisma.retailerProfile.findUnique({
      where: { id: row.retailerId },
      select: { userId: true },
    })
    if (!profile) continue

    // Both rows, not just the user. Registration writes them in one
    // transaction so they agree in production, but the admin table reads the
    // user's date while "average signup → first order" reads the profile's —
    // move only one and the dashboard still shows a negative number.
    const signedUpAt = new Date(first.getTime() - between(3, 21) * DAY)
    await prisma.user.update({
      where: { id: profile.userId },
      data: { createdAt: signedUpAt },
    })
    await prisma.retailerProfile.update({
      where: { id: row.retailerId },
      data: { createdAt: signedUpAt },
    })
  }

  // Brands too, so "member since" on the seller dashboard predates its sales.
  const firstOrderPerBrand = await prisma.order.groupBy({
    by: ['brandId'],
    _min: { createdAt: true },
  })

  for (const row of firstOrderPerBrand) {
    const first = row._min.createdAt
    if (!first) continue

    const profile = await prisma.brandProfile.findUnique({
      where: { id: row.brandId },
      select: { userId: true },
    })
    if (!profile) continue

    const joinedAt = new Date(first.getTime() - between(7, 40) * DAY)
    await prisma.user.update({
      where: { id: profile.userId },
      data: { createdAt: joinedAt },
    })
    await prisma.brandProfile.update({
      where: { id: row.brandId },
      data: { createdAt: joinedAt },
    })
  }
  console.log('  signup dates moved ahead of first orders')

  // --- wallet ledger --------------------------------------------------------
  // Mirrors what settlement does in the application: a credit for the sale and
  // a debit for commission, so a brand's balance is the same number the real
  // flow would have produced.
  for (const s of settledForWallet) {
    await prisma.walletTransaction.createMany({
      data: [
        {
          brandId: s.brandId,
          orderId: s.orderId,
          type: 'SALE_CREDIT',
          amountMinor: s.subtotalMinor,
          createdAt: s.at,
        },
        {
          brandId: s.brandId,
          orderId: s.orderId,
          type: 'COMMISSION_DEBIT',
          amountMinor: -s.commissionMinor,
          createdAt: s.at,
        },
      ],
    })
  }
  console.log(`  ${settledForWallet.length * 2} wallet rows`)

  // --- reviews --------------------------------------------------------------
  // Only on delivered orders, matching the verified-purchase rule the API
  // enforces. Skewed high but not uniform, so store ratings differ.
  const STARS = [5, 5, 5, 5, 4, 4, 4, 3, 5, 4]
  const COMMENTS = [
    'Sells well, will reorder.',
    'Good margin for us.',
    'Customers ask for this by name.',
    'Packaging arrived intact.',
    'Steady seller on the counter.',
    null,
    null,
  ]

  let reviews = 0
  for (const d of deliveredForReview) {
    if (random() > 0.45) continue
    const productId = pick(d.productIds)
    const already = await prisma.review.findFirst({
      where: { productId, retailerId: d.retailerId },
      select: { id: true },
    })
    if (already) continue

    await prisma.review.create({
      data: {
        productId,
        retailerId: d.retailerId,
        orderId: d.orderId,
        rating: pick(STARS),
        comment: pick(COMMENTS),
        createdAt: new Date(d.at.getTime() + DAY),
      },
    })
    reviews++
  }
  console.log(`  ${reviews} reviews`)

  // --- follows --------------------------------------------------------------
  let follows = 0
  for (const retailer of retailers) {
    for (const brand of brands) {
      if (random() > 0.5) continue
      const existing = await prisma.brandFollow.findFirst({
        where: { retailerId: retailer.id, brandId: brand.id },
        select: { id: true },
      })
      if (existing) continue
      await prisma.brandFollow.create({
        data: { retailerId: retailer.id, brandId: brand.id },
      })
      follows++
    }
  }
  console.log(`  ${follows} follows`)
}

await main()
await prisma.$disconnect()
console.log(
  '\n  demo data ready — re-run any time, it replaces only MT-DEMO- orders\n'
)
