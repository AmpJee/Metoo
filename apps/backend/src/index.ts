import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import { env } from './config/env.ts'
import { logger } from './lib/logger.ts'
import { errorHandler } from './middleware/error.ts'
import { healthModule } from './modules/health/index.ts'
import { usersModule } from './modules/users/index.ts'

export const app = new Elysia()
  .use(cors({ origin: env.CORS_ORIGIN }))
  .use(
    openapi({
      path: '/openapi',
      documentation: {
        info: {
          title: 'Metoo API',
          version: '0.0.0',
          description: 'B2B wholesale marketplace API (brands ↔ retailers).',
        },
      },
    })
  )
  .use(errorHandler)
  .use(healthModule)
  // Register new domain modules here.
  .use(usersModule)

// `0.0.0.0` rather than the default localhost: inside a container, binding to
// the loopback interface makes the server unreachable from outside it.
app.listen({ hostname: '0.0.0.0', port: env.PORT }, ({ port }) => {
  logger.info('API listening', {
    url: `http://localhost:${port}`,
    docs: `http://localhost:${port}/openapi`,
    env: env.NODE_ENV,
  })
})
