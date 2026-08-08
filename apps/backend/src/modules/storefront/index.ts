import { Elysia, t } from 'elysia'
import { CATEGORIES, TRADING_STATUS } from '@metoo/shared'
import { brandIdForUser, retailerIdForUser } from '../../lib/profile.ts'
import type { AuthContext } from '../../middleware/auth.ts'
import { optionalAccess, requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const rating = t.Object({
  average: t.Union([t.Number(), t.Null()]),
  count: t.Integer(),
})

const followResult = t.Object({
  following: t.Boolean(),
  followerCount: t.Integer(),
})

/**
 * The retailer profile behind an optional caller, if there is one.
 *
 * Anyone who is not an onboarded retailer — signed out, a brand, an admin, an
 * applicant still in the pipeline — is a viewer with no follow state, which
 * is exactly what `undefined` means to `service.storefront`.
 */
async function viewerRetailerId(auth: AuthContext | null) {
  if (auth?.role !== 'RETAILER' || auth.status !== TRADING_STATUS) {
    return undefined
  }
  return retailerIdForUser(auth.userId)
}

/**
 * The public store page — genuinely public now, like the catalog it sits
 * beside. A visitor who followed a link to a brand sees the shop; what they
 * cannot do is follow it.
 *
 * `optionalAccess` rather than no guard at all, because the same screen has
 * to serve both: a signed-in retailer still needs `following` to be true or
 * false rather than null, or their Follow button renders in the wrong state.
 * One route, two audiences, instead of a second anonymous copy that would
 * drift from this one.
 *
 * A brand previewing its own store reaches `/brand/storefront`, which returns
 * the identical shape.
 */
export const storefrontModule = new Elysia({
  name: 'storefront',
  prefix: '/stores',
})
  .use(optionalAccess)

  .get(
    '/:brandId',
    async ({ auth, params }) =>
      service.storefront(params.brandId, await viewerRetailerId(auth)),
    {
      params: t.Object({ brandId: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'A brand’s storefront',
        description:
          'Identity, store rating, follower count and every active product ' +
          'with its own rating. A brand that is not ONBOARDED returns 404, ' +
          'identically to one that does not exist.',
        tags: ['Storefront'],
      },
      response: {
        200: t.Object({
          id: t.String(),
          name: t.String(),
          description: t.Union([t.String(), t.Null()]),
          logoUrl: t.Union([t.String(), t.Null()]),
          province: t.String(),
          memberSince: t.Date(),
          rating,
          followerCount: t.Integer(),
          productCount: t.Integer(),
          /** Null for a viewer who is not a retailer. */
          following: t.Union([t.Boolean(), t.Null()]),
          products: t.Array(
            t.Object({
              id: t.String(),
              name: t.String(),
              photoUrl: t.Union([t.String(), t.Null()]),
              pricePerPackMinor: t.Integer(),
              minPacks: t.Integer(),
              unitsPerPack: t.Integer(),
              category: t.UnionEnum(CATEGORIES),
              stockPacks: t.Union([t.Integer(), t.Null()]),
              rating,
            })
          ),
        }),
      },
    }
  )

/**
 * Following is a retailer's action, so it keeps the full guard. Its own
 * instance rather than a `guard` block on the one above: the read route must
 * stay reachable without a token, and a guard applied to the group would take
 * that away.
 */
export const storefrontFollowModule = new Elysia({
  name: 'storefront-follow',
  prefix: '/stores',
})
  .use(requireAccess({ roles: ['RETAILER'], approved: true }))

  .post(
    '/:brandId/follow',
    async ({ auth, params }) =>
      service.follow(await retailerIdForUser(auth.userId), params.brandId),
    {
      params: t.Object({ brandId: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Follow a brand',
        description:
          'Idempotent — following twice is not an error and does not inflate ' +
          'the count. Returns the new total so the button and the number ' +
          'update from one call.',
        tags: ['Storefront'],
      },
      response: { 200: followResult },
    }
  )

  .delete(
    '/:brandId/follow',
    async ({ auth, params }) =>
      service.unfollow(await retailerIdForUser(auth.userId), params.brandId),
    {
      params: t.Object({ brandId: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Unfollow a brand',
        description: 'Idempotent — unfollowing what you do not follow is fine.',
        tags: ['Storefront'],
      },
      response: { 200: followResult },
    }
  )

/**
 * "Preview Store" in the seller nav.
 *
 * Deliberately the same service call as the buyer-facing route, so the preview
 * cannot drift from what buyers actually see — which is the only thing that
 * makes a preview worth having. `following` comes back null: a brand does not
 * follow itself.
 */
export const storePreviewModule = new Elysia({
  name: 'store-preview',
  prefix: '/brand/storefront',
})
  .use(requireAccess({ roles: ['BRAND'], approved: true }))

  .get(
    '/',
    async ({ auth }) => service.storefront(await brandIdForUser(auth.userId)),
    {
      detail: {
        summary: 'Preview your own store',
        description:
          'Exactly what a buyer sees, from the same code path. Only active ' +
          'products appear.',
        tags: ['Brand · Storefront'],
      },
    }
  )

/** The retailer's own list of followed brands. */
export const followingModule = new Elysia({
  name: 'following',
  prefix: '/following',
})
  .use(requireAccess({ roles: ['RETAILER'], approved: true }))

  .get(
    '/',
    async ({ auth }) =>
      service.listFollowed(await retailerIdForUser(auth.userId)),
    {
      detail: {
        summary: 'Brands you follow',
        description:
          'Most recently followed first. Brands that have since left ' +
          'ONBOARDED are omitted rather than shown as dead links.',
        tags: ['Storefront'],
      },
      response: {
        200: t.Array(
          t.Object({
            followedAt: t.Date(),
            id: t.String(),
            name: t.String(),
            logoUrl: t.Union([t.String(), t.Null()]),
            province: t.String(),
            followerCount: t.Integer(),
          })
        ),
      },
    }
  )
