/**
 * Liveness + readiness endpoint.
 *
 * Docker Compose and Railway both point their healthchecks here, so it must
 * stay cheap and dependency-light. It returns 503 when the database is
 * unreachable — a process that is up but cannot serve data is not healthy,
 * and Railway should not route traffic to it.
 */
import { Elysia, t } from 'elysia'
import { isDatabaseReachable } from '../../config/prisma.ts'

export const healthModule = new Elysia({ name: 'health' }).get(
  '/health',
  async ({ set }) => {
    const dbUp = await isDatabaseReachable()
    if (!dbUp) set.status = 503

    return {
      status: dbUp ? 'ok' : 'degraded',
      db: dbUp ? 'up' : 'down',
      uptime: Math.round(process.uptime()),
    }
  },
  {
    detail: {
      summary: 'Health check',
      description: 'Reports process uptime and whether Supabase is reachable.',
      tags: ['System'],
    },
    // One schema covering both status codes. Splitting it per-code would force
    // the handler to return a different shape per branch for no real gain.
    response: t.Object({
      status: t.UnionEnum(['ok', 'degraded']),
      db: t.UnionEnum(['up', 'down']),
      uptime: t.Number(),
    }),
  }
)
