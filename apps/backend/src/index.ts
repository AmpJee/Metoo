import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import { env } from './config/env.ts'
import { logger } from './lib/logger.ts'
import { errorHandler } from './middleware/error.ts'
import {
  brandProfileModule,
  retailerProfileModule,
} from './modules/account/index.ts'
import { adminModule } from './modules/admin/index.ts'
import { adminOrdersModule } from './modules/admin-orders/index.ts'
import { adminSummaryModule } from './modules/admin-summary/index.ts'
import { adminWithdrawalsModule } from './modules/admin-withdrawals/index.ts'
import { authModule } from './modules/auth/index.ts'
import { brandCustomersModule } from './modules/brand-customers/index.ts'
import { brandDashboardModule } from './modules/brand-dashboard/index.ts'
import { brandOrdersModule } from './modules/brand-orders/index.ts'
import { cartModule } from './modules/cart/index.ts'
import { catalogModule } from './modules/catalog/index.ts'
import { chatModule } from './modules/chat/index.ts'
import { checkoutModule } from './modules/checkout/index.ts'
import {
  favouritesModule,
  savedForLaterModule,
  savedStatusModule,
} from './modules/favourites/index.ts'
import {
  adminFeedbackModule,
  feedbackModule,
} from './modules/feedback/index.ts'
import { healthModule } from './modules/health/index.ts'
import { ordersModule } from './modules/orders/index.ts'
import {
  productImageUploadModule,
  productImagesModule,
} from './modules/product-images/index.ts'
import { productsModule } from './modules/products/index.ts'
import { reviewsModule, reviewsPublicModule } from './modules/reviews/index.ts'
import {
  followingModule,
  storePreviewModule,
  storefrontFollowModule,
  storefrontModule,
} from './modules/storefront/index.ts'
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
  .use(retailerProfileModule)
  .use(brandProfileModule)
  .use(adminModule)
  .use(productsModule)
  .use(productImagesModule)
  .use(productImageUploadModule)
  .use(catalogModule)
  .use(favouritesModule)
  .use(savedForLaterModule)
  .use(savedStatusModule)
  .use(cartModule)
  .use(chatModule)
  .use(checkoutModule)
  .use(ordersModule)
  .use(brandOrdersModule)
  .use(brandDashboardModule)
  .use(brandCustomersModule)
  .use(adminOrdersModule)
  .use(walletModule)
  .use(adminWithdrawalsModule)
  .use(adminSummaryModule)
  .use(reviewsPublicModule)
  .use(reviewsModule)
  .use(storefrontModule)
  .use(storefrontFollowModule)
  .use(followingModule)
  .use(storePreviewModule)
  .use(feedbackModule)
  .use(adminFeedbackModule)
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
