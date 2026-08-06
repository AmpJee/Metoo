# Backend image.
#
# IMPORTANT: build context is the REPO ROOT, not this directory — the install
# needs bun.lock and every workspace manifest to resolve the workspace graph.
#
#   docker build -f apps/backend/Dockerfile .
#
# docker-compose.yml and railway.json are both already set up this way.

FROM oven/bun:1.3.14-slim AS base
WORKDIR /app

# --- manifests --------------------------------------------------------------
# Manifests only, so every stage below reuses this layer until a dependency
# actually changes. All workspace manifests are needed even when installing
# one app: bun validates the whole graph against the lockfile.
FROM base AS manifests
# tsconfig.json travels with the manifests because each app's tsconfig
# extends it — `prisma generate` reads that chain and fails without it.
COPY package.json bun.lock tsconfig.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/

# --- build ------------------------------------------------------------------
# Bun runs TypeScript directly, so there is no compile step. The only build
# work is generating the Prisma client — which needs the prisma CLI, a
# devDependency, hence the non-production install here.
FROM manifests AS build
RUN bun install --frozen-lockfile --filter @metoo/backend
COPY packages/shared packages/shared
COPY apps/backend apps/backend
WORKDIR /app/apps/backend
RUN bunx prisma generate

# --- prod-deps --------------------------------------------------------------
# Runtime dependencies only. Dropping devDependencies leaves the prisma CLI,
# prisma studio, typescript and turbo out of the final image.
FROM manifests AS prod-deps
RUN bun install --frozen-lockfile --production --filter @metoo/backend

# --- runner -----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production

COPY --from=prod-deps --chown=bun:bun /app/node_modules node_modules
COPY --from=prod-deps --chown=bun:bun /app/apps/backend/node_modules apps/backend/node_modules
COPY --chown=bun:bun package.json tsconfig.json ./
COPY --chown=bun:bun packages/shared packages/shared
COPY --chown=bun:bun apps/backend apps/backend
# The generated Prisma client is gitignored and .dockerignore'd, so it comes
# from the build stage rather than the context.
COPY --from=build --chown=bun:bun /app/apps/backend/src/generated apps/backend/src/generated

# Drop root. The app only reads from disk, so it needs no write access.
USER bun
WORKDIR /app/apps/backend

EXPOSE 3000
CMD ["bun", "src/index.ts"]
