import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import { env } from './config/env.ts'
import { logger } from './lib/logger.ts'
import { errorHandler } from './middleware/error.ts'
import { adminModule } from './modules/admin/index.ts'
import { authModule } from './modules/auth/index.ts'
import { brandOrdersModule } from './modules/brand-orders/index.ts'
import { cartModule } from './modules/cart/index.ts'
import { catalogModule } from './modules/catalog/index.ts'
import { checkoutModule } from './modules/checkout/index.ts'
import { favouritesModule } from './modules/favourites/index.ts'
import { healthModule } from './modules/health/index.ts'
import { ordersModule } from './modules/orders/index.ts'
import { productsModule } from './modules/products/index.ts'

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
  .use(authModule)
  .use(adminModule)
  .use(productsModule)
  .use(catalogModule)
  .use(favouritesModule)
  .use(cartModule)
  .use(checkoutModule)
  .use(ordersModule)
  .use(brandOrdersModule)

// `0.0.0.0` rather than the default localhost: inside a container, binding to
// the loopback interface makes the server unreachable from outside it.
app.listen({ hostname: '0.0.0.0', port: env.PORT }, ({ port }) => {
  logger.info('API listening', {
    url: `http://localhost:${port}`,
    docs: `http://localhost:${port}/openapi`,
    env: env.NODE_ENV,
  })
})
