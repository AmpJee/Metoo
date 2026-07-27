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