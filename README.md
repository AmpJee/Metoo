# Metoo

### Project Structure

```
├── apps/
│   ├── backend/              # Elysia API server
│   │   ├── src/
│   │   │   ├── config/       # env validation, Prisma client
│   │   │   ├── modules/      # domain-based: auth, brands, retailers,
│   │   │   │                 # products, favourites, orders, chat,
│   │   │   │                 # payments, admin
│   │   │   ├── middleware/   # auth, error handling
│   │   │   ├── lib/          # logger, Supabase Storage helpers, errors
│   │   │   └── index.ts      # app entry point
│   │   ├── prisma/           # schema, migrations, seed script
│   │   └── Dockerfile
│   │
│   └── frontend/             # Elysia static server + vanilla pages
│       ├── src/
│       │   ├── pages/        # one .html file per screen
│       │   ├── scripts/      # one .js file per page, plus api-client.js
│       │   ├── styles/       # base tokens, components, page overrides
│       │   └── index.ts      # static server entry point
│       └── Dockerfile
│
├── packages/
│   └── shared/                # types + constants shared by both apps
│       └── src/
│           ├── types/         # Order, Product, User shapes
│           └── constants/     # order status, product categories
│
├── .github/workflows/ci.yml
├── turbo.json
├── package.json
└── bun.lockb
```

### Prompt for LLM

```
PROMPT
Production grade clean code project for B2B wholesale marketplace (brands ↔ retailers)
1. app has roles: admin, brand, retailer
2. admin can approve/reject brand and retailer signups, manually update order status (pending → confirmed → delivered), and approve/reject return requests
3. brand can list products (name, photo, price, MOQ, case size, category), manage incoming orders, and receive payouts via Stripe Connect minus platform commission
4. retailer can browse/filter catalog by category, add to cart across multiple brands, checkout, track order status, chat with brand, favourite products, and request returns post-delivery
5. design db diagram and write code with following tech stack
6. with protected routes JWT strategy, role-based access control (admin/brand/retailer)

#Condition
If retailer's cart spans multiple brands, checkout must split into one order per brand, not one order per checkout session
Payment failure keeps order in pending/failed state, retailer can retry checkout — never a dead end
Return requests only allowed post-delivery; seller/admin reviews; accepted → refund processed + order closed, rejected → order stays closed as delivered
Brand and retailer signups require manual approval before account is active; rejection loops back to a resubmit state, not a dead end
Commission is tiered by category and volume: Food & Beverage 4%/2%, Health & Beauty 8%/5%, Home & Living 5%/3% (new brand / 30+ orders per month)
Brand approval requires ID (SME/National ID) + อย. certificate check

Pls summarize requirements and count file when i said correct start write code

#Backend
1. Bun
2. Elysia
3. PostgreSQL via Supabase
4. Prisma ORM
5. Supabase Storage (public bucket for product photos, private bucket + signed URLs for verification documents)
6. Stripe (card + PromptPay) + Stripe Connect for brand payouts
7. JWT auth with role-based middleware

#Frontend
8. Plain HTML/CSS/JS, no framework, served via separate Elysia static app

#Deployment
1. Docker (backend + frontend)
2. Railway
3. GitHub Actions CI (lint, typecheck, backend tests against real Postgres, build)
```