# Frontend image — Next.js 16 (App Router) in standalone mode.
#
# IMPORTANT: build context is the REPO ROOT, not this directory.
#
#   docker build -f apps/frontend/Dockerfile .
#
# Two runtimes on purpose: Bun installs (it is the only thing that reads
# bun.lock), Node builds and serves. Building under Bun 1.3.14 crashes while
# prerendering Next's built-in /_global-error page with "useContext of null".
# Next's standalone output is a Node server regardless, so this is also the
# supported path.

# --- deps -------------------------------------------------------------------
# Manifests only, so this layer is cached until a dependency changes. All
# workspace manifests are needed: bun validates the whole graph against the
# lockfile.
FROM oven/bun:1.3.14-slim AS deps
WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile

# --- build ------------------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app
# Bun's isolated linker symlinks into node_modules/.bun, so the root and the
# workspace's own node_modules both have to come across with paths intact.
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/apps/frontend/node_modules apps/frontend/node_modules
COPY package.json bun.lock tsconfig.json ./
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
WORKDIR /app/apps/frontend
# API_URL is read per request, not baked in. A placeholder proves nothing
# depends on its value at build time.
ENV API_URL=http://build-time-placeholder.invalid
ENV NEXT_TELEMETRY_DISABLED=1
RUN node_modules/.bin/next build

# --- runner -----------------------------------------------------------------
# `output: 'standalone'` emits a server plus only the node_modules it traced,
# so nothing else from the workspace needs copying.
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build --chown=node:node /app/apps/frontend/public ./apps/frontend/public

USER node

EXPOSE 5173
ENV PORT=5173
ENV HOSTNAME=0.0.0.0

# outputFileTracingRoot is the repo root, so the server lands under its
# workspace path inside the standalone bundle.
CMD ["node", "apps/frontend/server.js"]
