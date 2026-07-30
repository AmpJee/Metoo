/**
 * Retailer-facing catalog browsing.
 *
 * Requires an APPROVED retailer: wholesale prices are not public, so an
 * unapproved account must not be able to read them.
 */
import { Elysia, t } from 'elysia'
import { CATEGORIES } from '@metoo/shared'
import { optionalEnum } from '../../lib/schema.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const brandStub = t.Object({
  id: t.String(),
  name: t.String(),
  logoUrl: t.Union([t.String(), t.Null()]),
  province: t.String(),
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
})

export const catalogModule = new Elysia({
  name: 'catalog',
  prefix: '/catalog',
})
  .use(requireAccess({ roles: ['RETAILER'], approved: true }))

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
      description: 'For the brand filter on the browse screen.',
      tags: ['Catalog'],
    },
    response: { 200: t.Array(brandStub) },
  })

  .get('/products/:id', ({ params }) => service.getVisible(params.id), {
    params: t.Object({ id: t.String({ format: 'uuid' }) }),
    detail: {
      summary: 'Product detail',
      description:
        'Returns 404 for an inactive product or one whose brand is not ' +
        'approved, identically to a product that does not exist.',
      tags: ['Catalog'],
    },
    response: { 200: catalogProduct },
  })
