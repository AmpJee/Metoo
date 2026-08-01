/**
 * Authentication routes.
 *
 * This module is the reference pattern for every domain module: TypeBox
 * schemas on input so bad requests fail at the edge with a 422, `response`
 * schemas so /openapi documents itself, AppError for expected failures, and
 * the Prisma work delegated to service.ts.
 */
import { Elysia, t } from 'elysia'
import { PIPELINE_STATUSES, ROLES } from '@metoo/shared'
import { CONTACT_FIELDS } from '../../lib/schema.ts'
import { requireAuth } from '../../middleware/auth.ts'
import * as service from './service.ts'

// t.UnionEnum, not t.Union(...map(t.Literal)): mapping widens the literals to
// `string`, which collapses the inferred response type to `never`.
const roleSchema = t.UnionEnum(ROLES)
const statusSchema = t.UnionEnum(PIPELINE_STATUSES)

const publicUser = t.Object({
  id: t.String(),
  email: t.String(),
  role: roleSchema,
  status: statusSchema,
  reviewNote: t.Union([t.String(), t.Null()]),
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

const session = t.Object({
  user: publicUser,
  accessToken: t.String(),
  refreshToken: t.String(),
})

const password = t.String({ minLength: 8, maxLength: 128 })

// A discriminated union on `role`: a brand signup and a retailer signup need
// genuinely different fields, and one merged object with everything optional
// would accept a brand with no name.
const registerBody = t.Union([
  t.Object({
    role: t.Literal('BRAND'),
    email: t.String({ format: 'email' }),
    password,
    name: t.String({ minLength: 1, maxLength: 120 }),
    description: t.Optional(t.String({ maxLength: 1000 })),
    ...CONTACT_FIELDS,
  }),
  t.Object({
    role: t.Literal('RETAILER'),
    email: t.String({ format: 'email' }),
    password,
    shopName: t.String({ minLength: 1, maxLength: 120 }),
    taxId: t.Optional(t.String({ maxLength: 20 })),
    ...CONTACT_FIELDS,
  }),
])

export const authModule = new Elysia({ name: 'auth', prefix: '/auth' })
  .post(
    '/register',
    async ({ body, set }) => {
      set.status = 201
      return service.register(body)
    },
    {
      body: registerBody,
      detail: {
        summary: 'Register a brand or retailer',
        description:
          'Creates the account and its profile, always with status PENDING. ' +
          'An admin must approve it before protected routes become reachable. ' +
          'Admins are not self-registerable.',
        tags: ['Auth'],
      },
      response: { 201: session },
    }
  )

  .post('/login', ({ body }) => service.login(body.email, body.password), {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 1 }),
    }),
    detail: {
      summary: 'Log in',
      description:
        'Succeeds regardless of approval status — a pending user must be ' +
        'able to sign in and see why they are blocked. Feature access is ' +
        'gated per-route instead.',
      tags: ['Auth'],
    },
    response: { 200: session },
  })

  .post('/refresh', ({ body }) => service.refresh(body.refreshToken), {
    body: t.Object({ refreshToken: t.String({ minLength: 1 }) }),
    detail: {
      summary: 'Exchange a refresh token for a new pair',
      description:
        'Rotates the token: the presented one is revoked, so replaying it ' +
        'a second time fails.',
      tags: ['Auth'],
    },
    response: { 200: session },
  })

  .post(
    '/logout',
    async ({ body }) => {
      await service.logout(body.refreshToken)
      return { ok: true }
    },
    {
      body: t.Object({ refreshToken: t.String({ minLength: 1 }) }),
      detail: {
        summary: 'Revoke a refresh token',
        description:
          'Always reports success, even for an unknown token, so it cannot ' +
          'be used to probe which tokens are valid.',
        tags: ['Auth'],
      },
      response: { 200: t.Object({ ok: t.Boolean() }) },
    }
  )

  .use(requireAuth)
  .get('/me', ({ auth }) => service.findUserById(auth.userId), {
    detail: {
      summary: 'Current account',
      description:
        'Includes the brand or retailer profile stub, whichever applies.',
      tags: ['Auth'],
    },
    response: {
      200: t.Composite([
        publicUser,
        t.Object({
          brand: t.Union([
            t.Object({ id: t.String(), name: t.String() }),
            t.Null(),
          ]),
          retailer: t.Union([
            t.Object({ id: t.String(), shopName: t.String() }),
            t.Null(),
          ]),
        }),
      ]),
    },
  })
