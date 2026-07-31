import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import { env } from './config/env.ts'
import { logger } from './lib/logger.ts'
import { errorHandler } from './middleware/error.ts'
import { adminModule } from './modules/admin/index.ts'
import { adminOrdersModule } from './modules/admin-orders/index.ts'
import { adminSummaryModule } from './modules/admin-summary/index.ts'
import { adminWithdrawalsModule } from './modules/admin-withdrawals/index.ts'
import { authModule } from './modules/auth/index.ts'
import { brandDashboardModule } from './modules/brand-dashboard/index.ts'
import { brandOrdersModule } from './modules/brand-orders/index.ts'
import { cartModule } from './modules/cart/index.ts'
import { catalogModule } from './modules/catalog/index.ts'
import { checkoutModule } from './modules/checkout/index.ts'
import { favouritesModule } from './modules/favourites/index.ts'
import { healthModule } from './modules/health/index.ts'
import { ordersModule } from './modules/orders/index.ts'
import { productsModule } from './modules/products/index.ts'
import { reviewsModule } from './modules/reviews/index.ts'
import { brandDocumentsModule, uploadsModule } from './modules/uploads/index.ts'
import {
  adminReturnsModule,
  brandReturnsModule,
  returnsModule,
} from './modules/returns/index.ts'
import { walletModule } from './modules/wallet/index.ts'

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
  .use(brandDashboardModule)
  .use(adminOrdersModule)
  .use(walletModule)
  .use(adminWithdrawalsModule)
  .use(adminSummaryModule)
  .use(reviewsModule)
  .use(uploadsModule)
  .use(brandDocumentsModule)
  .use(returnsModule)
  .use(brandReturnsModule)
  .use(adminReturnsModule)

// `0.0.0.0` rather than the default localhost: inside a container, binding to
// the loopback interface makes the server unreachable from outside it.
app.listen({ hostname: '0.0.0.0', port: env.PORT }, ({ port }) => {
  logger.info('API listening', {
    url: `http://localhost:${port}`,
    docs: `http://localhost:${port}/openapi`,
    env: env.NODE_ENV,
  })
})
