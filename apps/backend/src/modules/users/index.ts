/**
 * SAMPLE MODULE — this is the pattern to copy, not a feature to keep.
 *
 * It shows the shape every domain module should follow:
 *   - one Elysia instance per module, exported and mounted in src/index.ts
 *   - `prefix` owns the route namespace
 *   - TypeBox schemas on `body`/`params` so bad input fails at the edge (422)
 *     before any handler code runs
 *   - `response` schemas so /openapi documents itself
 *   - AppError for expected failures; never a bare throw
 *
 * Build `brands`, `products`, `orders`, `chat` etc. alongside this, then
 * delete it together with the sample User model.
 */
import { Elysia, t } from 'elysia'
import { ROLES } from '@metoo/shared'
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../middleware/error.ts'

// t.UnionEnum, not t.Union(ROLES.map(t.Literal)): mapping over the array
// widens the literals to `string`, which makes the inferred response type
// collapse to `never`. UnionEnum takes the const array and keeps the literals.
const roleSchema = t.UnionEnum(ROLES)

const userResponse = t.Object({
  id: t.String(),
  email: t.String(),
  name: t.String(),
  role: roleSchema,
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

export const usersModule = new Elysia({ name: 'users', prefix: '/users' })
  .get('/', () => prisma.user.findMany({ orderBy: { createdAt: 'desc' } }), {
    detail: {
      summary: 'List users',
      tags: ['Users (sample)'],
    },
    response: { 200: t.Array(userResponse) },
  })

  .get(
    '/:id',
    async ({ params }) => {
      const user = await prisma.user.findUnique({ where: { id: params.id } })
      if (!user) {
        throw new AppError(
          404,
          'USER_NOT_FOUND',
          `No user with id ${params.id}.`
        )
      }
      return user
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      detail: { summary: 'Get one user', tags: ['Users (sample)'] },
    }
  )

  .post(
    '/',
    async ({ body, set }) => {
      const existing = await prisma.user.findUnique({
        where: { email: body.email },
      })
      if (existing) {
        throw new AppError(
          409,
          'EMAIL_TAKEN',
          `${body.email} is already registered.`
        )
      }

      set.status = 201
      return prisma.user.create({ data: body })
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        name: t.String({ minLength: 1, maxLength: 120 }),
        role: t.Optional(roleSchema),
      }),
      detail: { summary: 'Create a user', tags: ['Users (sample)'] },
      response: { 201: userResponse },
    }
  )
