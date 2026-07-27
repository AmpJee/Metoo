# Frontend image — Elysia serving the vanilla HTML/CSS/JS.
#
# IMPORTANT: build context is the REPO ROOT, not this directory.
#
#   docker build -f apps/frontend/Dockerfile .

FROM oven/bun:1.3.14-slim AS base
WORKDIR /app

# --- deps -------------------------------------------------------------------
# `--filter` keeps the backend's dependency tree (Prisma alone is ~140MB) out
# of this image; `--production` drops the toolchain. All workspace manifests
# are still required for bun to validate the lockfile.
FROM base AS deps
COPY package.json bun.lock tsconfig.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile --production --filter @metoo/frontend

# --- runner -----------------------------------------------------------------
# No build stage: there is no bundler and no transpile. The assets ship as
# they are written, which is the whole point of the vanilla setup.
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps --chown=bun:bun /app/node_modules node_modules
COPY --from=deps --chown=bun:bun /app/apps/frontend/node_modules apps/frontend/node_modules
COPY --chown=bun:bun package.json tsconfig.json ./
COPY --chown=bun:bun apps/frontend apps/frontend

USER bun
WORKDIR /app/apps/frontend

EXPOSE 5173
CMD ["bun", "src/index.ts"]
