/**
 * Remove demo data, keeping only the named accounts and what belongs to them.
 *
 * Run before putting real customers on the platform: seeded shops, seeded
 * brands and 90-odd fabricated orders are not something a real retailer
 * should be browsing, and the `@metoo.test` accounts all share one published
 * password.
 *
 *   bun run prisma/prune-demo-data.ts          # dry run, prints the plan
 *   bun run prisma/prune-demo-data.ts --apply  # actually deletes
 *
 * Destructive and NOT reversible. It prints exactly what it will remove and
 * refuses to touch anything unless --apply is passed, because the version of
 * this that silently did the right thing is also the version that silently
 * does the wrong thing when KEEP has a typo in it.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.ts'

/** The only accounts that survive. Everything else, and everything of theirs, goes. */
const KEEP = [
  'brand@metoo.test',
  'retailer@metoo.test',
  'admin@metoo.test',
  'klakawee.sk@gmail.com',
  'ahowbanyapon@gmail.com',
  'enerpheregroup@gmail.com',
  'yajaaofficial@gmail.com',
]

const apply = process.argv.includes('--apply')

const prisma = new PrismaClient({
  // DIRECT_URL, not the pooler: this runs a long transaction.
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
})

const keepUsers = await prisma.user.findMany({
  where: { email: { in: KEEP } },
  select: {
    id: true,
    email: true,
    role: true,
    brand: { select: { id: true, name: true } },
    retailer: { select: { id: true, shopName: true } },
  },
})

// A typo in KEEP would silently delete an account meant to survive, so stop
// rather than guess.
if (keepUsers.length !== KEEP.length) {
  const found = new Set(keepUsers.map((u) => u.email))
  console.error('These accounts do not exist — refusing to run:')
  for (const email of KEEP.filter((e) => !found.has(e))) {
    console.error(`  ${email}`)
  }
  process.exit(1)
}

const keepUserIds = keepUsers.map((u) => u.id)
const keepBrandIds = keepUsers.flatMap((u) => (u.brand ? [u.brand.id] : []))
const keepRetailerIds = keepUsers.flatMap((u) =>
  u.retailer ? [u.retailer.id] : []
)

/**
 * Any order touching a party that is going.
 *
 * Both sides, not just one: an order whose brand still exists but whose
 * retailer does not is a row the console cannot render and the seller cannot
 * explain. Half an order is worse than none.
 */
const doomedOrders = await prisma.order.findMany({
  where: {
    OR: [
      { brandId: { notIn: keepBrandIds } },
      { retailerId: { notIn: keepRetailerIds } },
    ],
  },
  select: { id: true },
})
const orderIds = doomedOrders.map((o) => o.id)

console.log('KEEPING:')
for (const u of keepUsers) {
  const who = u.brand
    ? `brand "${u.brand.name}"`
    : u.retailer
      ? `shop "${u.retailer.shopName}"`
      : '—'
  console.log(`  ${u.email.padEnd(26)} ${u.role.padEnd(9)} ${who}`)
}

const doomedUsers = await prisma.user.findMany({
  where: { id: { notIn: keepUserIds } },
  select: { email: true, role: true },
})

console.log(`\nDELETING ${doomedUsers.length} accounts:`)
for (const u of doomedUsers) console.log(`  ${u.email.padEnd(30)} ${u.role}`)
console.log(`\nDELETING ${orderIds.length} orders and everything attached.`)

if (!apply) {
  console.log('\nDry run. Nothing was changed. Re-run with --apply to delete.')
  process.exit(0)
}

// One transaction: a half-pruned database is harder to reason about than
// either state. Order matters — children before parents.
await prisma.$transaction(
  async (tx) => {
    // Reviews first, and by ORDER as well as by retailer.
    //
    // Review.orderId is its proof of purchase and does NOT cascade, so a
    // review written by a retailer who survives, against an order that does
    // not, holds the order row hostage. That is exactly what failed the first
    // time this ran: Somchai Minimart had rated a product from a brand being
    // removed.
    await tx.review.deleteMany({
      where: {
        OR: [
          { orderId: { in: orderIds } },
          { retailerId: { notIn: keepRetailerIds } },
        ],
      },
    })

    await tx.returnRequest.deleteMany({ where: { orderId: { in: orderIds } } })
    await tx.refund.deleteMany({ where: { orderId: { in: orderIds } } })
    await tx.walletTransaction.deleteMany({
      where: { orderId: { in: orderIds } },
    })
    await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } })
    await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
    await tx.order.deleteMany({ where: { id: { in: orderIds } } })

    await tx.favourite.deleteMany({
      where: { retailerId: { notIn: keepRetailerIds } },
    })
    await tx.brandFollow.deleteMany({
      where: {
        OR: [
          { retailerId: { notIn: keepRetailerIds } },
          { brandId: { notIn: keepBrandIds } },
        ],
      },
    })
    await tx.message.deleteMany({
      where: {
        thread: {
          OR: [
            { retailerId: { notIn: keepRetailerIds } },
            { brandId: { notIn: keepBrandIds } },
          ],
        },
      },
    })
    await tx.chatThread.deleteMany({
      where: {
        OR: [
          { retailerId: { notIn: keepRetailerIds } },
          { brandId: { notIn: keepBrandIds } },
        ],
      },
    })
    await tx.cartItem.deleteMany({
      where: { cart: { retailerId: { notIn: keepRetailerIds } } },
    })
    await tx.cart.deleteMany({
      where: { retailerId: { notIn: keepRetailerIds } },
    })

    await tx.withdrawalRequest.deleteMany({
      where: { brandId: { notIn: keepBrandIds } },
    })
    await tx.walletTransaction.deleteMany({
      where: { brandId: { notIn: keepBrandIds } },
    })
    await tx.productImage.deleteMany({
      where: { product: { brandId: { notIn: keepBrandIds } } },
    })
    await tx.product.deleteMany({
      where: { brandId: { notIn: keepBrandIds } },
    })
    await tx.verificationDocument.deleteMany({
      where: {
        OR: [
          { brandId: { notIn: keepBrandIds } },
          { retailerId: { notIn: keepRetailerIds } },
        ],
      },
    })

    await tx.feedback.deleteMany({
      where: { authorId: { notIn: keepUserIds } },
    })
    await tx.auditLog.deleteMany({ where: { actorId: { notIn: keepUserIds } } })
    await tx.refreshToken.deleteMany({
      where: { userId: { notIn: keepUserIds } },
    })
    await tx.brandProfile.deleteMany({
      where: { userId: { notIn: keepUserIds } },
    })
    await tx.retailerProfile.deleteMany({
      where: { userId: { notIn: keepUserIds } },
    })
    await tx.user.deleteMany({ where: { id: { notIn: keepUserIds } } })
  },
  { timeout: 60_000 }
)

console.log('\nDone. Totals now:')
for (const [label, count] of [
  ['users', await prisma.user.count()],
  ['brands', await prisma.brandProfile.count()],
  ['retailers', await prisma.retailerProfile.count()],
  ['products', await prisma.product.count()],
  ['orders', await prisma.order.count()],
  ['reviews', await prisma.review.count()],
] as const) {
  console.log(`  ${label}: ${count}`)
}
