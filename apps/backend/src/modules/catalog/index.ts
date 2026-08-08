/**
 * Catalog browsing — public.
 *
 * Deliberately reachable without a session. A shop that will not show anyone
 * what it sells until they have signed up and been approved has no way to
 * earn the signup, and this is where a visitor arrives from a shared link.
 *
 * That is a reversal of the original rule ("wholesale prices are not public")
 * and it was taken knowingly: prices are the reason a retailer decides
 * whether to bother registering. What stays behind the gate is everything
 * that acts — cart, checkout, orders, favourites — so a visitor can look at
 * the whole catalog and can do nothing with it until they have an account.
 *
 * These routes read nothing about the caller, which is what makes them safe
 * to open: there is no per-retailer field here to leak.
 */
import { Elysia, t } from 'elysia'
import { CATEGORIES } from '@metoo/shared'
import { optionalEnum } from '../../lib/schema.ts'
import * as service from './service.ts'

const brandStub = t.Object({
  id: t.String(),
  name: t.String(),
  logoUrl: t.Union([t.String(), t.Null()]),
  province: t.String(),
})

/** Null average rather than zero — an unrated product is not a bad one. */
const rating = t.Object({
  average: t.Union([t.Number(), t.Null()]),
  count: t.Integer(),
})

const catalogProduct = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
  photoUrl: t.Union([t.String(), t.Null()]),
  pricePerPackMinor: t.Integer(),
  minPacks: t.Integer(),
  unitsPerPack: t.Integer(),
  category: t.UnionEnum(CATEGORIES),
  stockPacks: t.Union([t.Integer(), t.Null()]),
  createdAt: t.Date(),
  brand: brandStub,
  rating,
})

/**
 * Detail carries the spec; the browse list does not.
 *
 * `ingredients` runs to 2 KB and no product card shows it, so putting these on
 * a 24-row page would cost ~50 KB a scroll to render nothing.
 */
const catalogProductDetail = t.Composite([
  catalogProduct,
  t.Object({
    /** Every photo, in display order. Position 0 is the cover (`photoUrl`). */
    images: t.Array(
      t.Object({
        id: t.String(),
        url: t.String(),
        position: t.Integer(),
        altText: t.Union([t.String(), t.Null()]),
      })
    ),
    /** The "Amount" quick-pick buttons, in display order. */
    packPresets: t.Array(t.Integer()),
    /**
     * Volume pricing, cheapest threshold first. At `minPacks` or more, every
     * pack costs `pricePerPackMinor` — the whole quantity, not a blend.
     */
    priceTiers: t.Array(
      t.Object({ minPacks: t.Integer(), pricePerPackMinor: t.Integer() })
    ),
    sku: t.Union([t.String(), t.Null()]),
    barcode: t.Union([t.String(), t.Null()]),
    packWeightGrams: t.Union([t.Integer(), t.Null()]),
    ingredients: t.Union([t.String(), t.Null()]),
    shelfLifeDays: t.Union([t.Integer(), t.Null()]),
  }),
])

export const catalogModule = new Elysia({
  name: 'catalog',
  prefix: '/catalog',
})

  .get(
    '/products',
    ({ query }) =>
      service.browse({
        category: query.category,
        brandId: query.brandId,
        q: query.q,
        cursor: query.cursor,
        limit: query.limit ?? 24,
      }),
    {
      query: t.Object({
        // optionalEnum, not t.Optional(t.UnionEnum(...)) — the latter defaults
        // an omitted filter to the first category. See lib/schema.ts.
        category: optionalEnum(CATEGORIES),
        brandId: t.Optional(t.String({ format: 'uuid' })),
        q: t.Optional(t.String({ maxLength: 100 })),
        cursor: t.Optional(t.String({ format: 'uuid' })),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
      }),
      detail: {
        summary: 'Browse the catalog',
        description:
          'Only active products from approved brands. Paginate by passing the ' +
          'returned nextCursor; a null nextCursor means the last page.',
        tags: ['Catalog'],
      },
      response: {
        200: t.Object({
          items: t.Array(catalogProduct),
          nextCursor: t.Union([t.String(), t.Null()]),
        }),
      },
    }
  )

  .get('/brands', () => service.listBrands(), {
    detail: {
      summary: 'Brands that currently have products',
      description:
        'For the brand filter and the storefront header. Each carries its ' +
        'store rating, aggregated across that brand’s product reviews.',
      tags: ['Catalog'],
    },
    response: {
      200: t.Array(t.Composite([brandStub, t.Object({ rating })])),
    },
  })

  .get('/products/:id', ({ params }) => service.getVisible(params.id), {
    params: t.Object({ id: t.String({ format: 'uuid' }) }),
    detail: {
      summary: 'Product detail',
      description:
        'Returns 404 for an inactive product or one whose brand is not ' +
        'approved, identically to a product that does not exist. Carries the ' +
        'spec — barcode, pack weight, ingredients, shelf life — which the ' +
        'browse list deliberately omits to keep a page of 24 small.',
      tags: ['Catalog'],
    },
    response: { 200: catalogProductDetail },
  })
