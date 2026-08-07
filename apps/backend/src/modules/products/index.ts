/**
 * Brand product management.
 *
 * Every route requires an APPROVED brand: a pending brand can sign in and see
 * why it is blocked, but must not be able to list products a retailer would
 * then be shown.
 */
import { Elysia, t } from 'elysia'
import { CATEGORIES } from '@metoo/shared'
import { MAX_PRESETS } from '../../domain/pack-presets.ts'
import { MAX_PRODUCT_IMAGES } from '../../domain/product-images.ts'
import { MAX_TIERS } from '../../domain/volume-pricing.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const categorySchema = t.UnionEnum(CATEGORIES)

const productResponse = t.Object({
  id: t.String(),
  brandId: t.String(),
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
  photoUrl: t.Union([t.String(), t.Null()]),
  pricePerPackMinor: t.Integer(),
  minPacks: t.Integer(),
  unitsPerPack: t.Integer(),
  packPresets: t.Array(t.Integer()),
  /** Volume pricing ladder, cheapest threshold first. */
  priceTiers: t.Array(
    t.Object({ minPacks: t.Integer(), pricePerPackMinor: t.Integer() })
  ),
  category: categorySchema,
  stockPacks: t.Union([t.Integer(), t.Null()]),
  isActive: t.Boolean(),
  sku: t.Union([t.String(), t.Null()]),
  barcode: t.Union([t.String(), t.Null()]),
  packWeightGrams: t.Union([t.Integer(), t.Null()]),
  ingredients: t.Union([t.String(), t.Null()]),
  shelfLifeDays: t.Union([t.Integer(), t.Null()]),
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

// Prices are integer satang, never a decimal — see CLAUDE.md. Exposing this as
// `pricePerPackMinor` in the API keeps the frontend honest about the unit too.
const productBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  description: t.Optional(t.String({ maxLength: 2000 })),
  photoUrl: t.Optional(t.String({ format: 'uri', maxLength: 2000 })),
  pricePerPackMinor: t.Integer({ minimum: 1 }),
  // Optional with NO schema `default`. Elysia applies a TypeBox default to an
  // absent property, and t.Partial keeps defaults — so `default: 1` here meant
  // every PATCH silently carried minPacks:1 and reset the product's real
  // minimum. Prisma's @default(1) covers creation instead, where it cannot
  // leak into an update. Same failure as the t.UnionEnum gotcha in
  // lib/schema.ts, but this one corrupted stored data rather than a filter.
  minPacks: t.Optional(t.Integer({ minimum: 1 })),
  unitsPerPack: t.Optional(t.Integer({ minimum: 1 })),
  // Ascending, each at least minPacks — enforced in the domain layer, which
  // can see minPacks. The bound here only caps the row length.
  packPresets: t.Optional(
    t.Array(t.Integer({ minimum: 1 }), { maxItems: MAX_PRESETS })
  ),
  // Volume pricing. Thresholds ascending, prices descending, every one below
  // the base price and above minPacks — the domain layer enforces all of that,
  // because "buying more must never cost more" is a rule, not a shape.
  priceTiers: t.Optional(
    t.Array(
      t.Object({
        minPacks: t.Integer({ minimum: 1 }),
        pricePerPackMinor: t.Integer({ minimum: 1 }),
      }),
      { maxItems: MAX_TIERS }
    )
  ),
  category: categorySchema,
  stockPacks: t.Optional(t.Integer({ minimum: 0 })),
  isActive: t.Optional(t.Boolean()),

  // Nullable, not merely optional: a brand has to be able to clear one of
  // these, and an omitted key on a PATCH means "leave it alone".
  sku: t.Optional(
    t.Union([t.String({ minLength: 1, maxLength: 40 }), t.Null()])
  ),
  // Length and digits only — the check digit is arithmetic over the other
  // digits and no regex can express it, so the domain layer does that part.
  barcode: t.Optional(
    t.Union([t.String({ pattern: '^\\d{8,14}$' }), t.Null()])
  ),
  // 50 kg a pack is already implausible for something a courier carries; the
  // ceiling is there to catch a kg value typed into a grams field.
  packWeightGrams: t.Optional(
    t.Union([t.Integer({ minimum: 1, maximum: 50000 }), t.Null()])
  ),
  ingredients: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
  // Ten years. Longer than any อย.-registered shelf life and short enough to
  // catch a date pasted in where a day count belongs.
  shelfLifeDays: t.Optional(
    t.Union([t.Integer({ minimum: 1, maximum: 3650 }), t.Null()])
  ),
})

export const productsModule = new Elysia({
  name: 'products',
  prefix: '/brand/products',
})
  .use(requireAccess({ roles: ['BRAND'], approved: true }))

  .get(
    '/',
    async ({ auth }) =>
      service.listForBrand(await service.brandIdForUser(auth.userId)),
    {
      detail: {
        summary: "List this brand's products",
        description: 'Includes inactive products, which retailers cannot see.',
        tags: ['Brand · Products'],
      },
      response: { 200: t.Array(productResponse) },
    }
  )

  .post(
    '/',
    async ({ auth, body, set }) => {
      set.status = 201
      const { images, ...product } = body
      return service.create(
        await service.brandIdForUser(auth.userId),
        product,
        images
      )
    },
    {
      body: t.Composite([
        productBody,
        t.Object({
          // Storage keys from POST /brand/product-images/upload-url. Array
          // order is display order; the first becomes the cover.
          images: t.Optional(
            t.Array(
              t.Object({
                storageKey: t.String({ maxLength: 500 }),
                altText: t.Optional(t.String({ maxLength: 200 })),
              }),
              { maxItems: MAX_PRODUCT_IMAGES }
            )
          ),
        }),
      ]),
      detail: {
        summary: 'Create a product',
        description:
          'photoUrl is a plain image URL for now; a Supabase upload route ' +
          'replaces it later. minPacks and unitsPerPack are the wholesale terms ' +
          'enforced when a retailer adds this to a cart. ' +
          'sku must be unique within your own catalog (409 otherwise) but may ' +
          'collide with another brand’s. barcode is checked against its GTIN ' +
          'check digit, so a mistyped or transposed digit is rejected here ' +
          'rather than at the retailer’s till. ' +
          'priceTiers is volume pricing: at minPacks or more, every pack ' +
          'costs pricePerPackMinor instead of the product price — the whole ' +
          'quantity, not a blend. Thresholds must ascend, prices must ' +
          'descend, and each must sit above minPacks and below the base ' +
          'price, so a bigger basket can never cost more per pack. ' +
          'Photos: upload each one via POST /brand/product-images/upload-url ' +
          'first, then send the storageKeys in `images`. Product and images ' +
          'are written in one transaction, so a bad key fails the whole ' +
          'create rather than leaving a half-built product.',
        tags: ['Brand · Products'],
      },
      response: { 201: productResponse },
    }
  )

  .get(
    '/:id',
    async ({ auth, params }) =>
      service.getForBrand(await service.brandIdForUser(auth.userId), params.id),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Get one of this brand’s products',
        description:
          'Another brand’s product id returns 404 rather than 403, so the ' +
          'endpoint cannot be used to discover that an id exists.',
        tags: ['Brand · Products'],
      },
      response: { 200: productResponse },
    }
  )

  .patch(
    '/:id',
    async ({ auth, params, body }) =>
      service.update(
        await service.brandIdForUser(auth.userId),
        params.id,
        body
      ),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Partial(productBody),
      detail: {
        summary: 'Update a product',
        description:
          'Editing a price does not rewrite history — OrderItem snapshots the ' +
          'price at the time of sale.',
        tags: ['Brand · Products'],
      },
      response: { 200: productResponse },
    }
  )

  .delete(
    '/:id',
    async ({ auth, params }) =>
      service.remove(await service.brandIdForUser(auth.userId), params.id),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Delete or retire a product',
        description:
          'A product that has never been ordered is deleted. One that has is ' +
          'deactivated instead, because order history still references it.',
        tags: ['Brand · Products'],
      },
      response: {
        200: t.Object({ deleted: t.Boolean(), deactivated: t.Boolean() }),
      },
    }
  )
