# syntax=docker/dockerfile:1.7

# Production image for Pulse 360. Uses Next.js standalone output, which
# next.config.js enables whenever VERCEL is unset (Vercel builds do not use
# this file). Build: docker build -t pulse360 .
#
# Pin to an immutable digest (node:24-bookworm-slim@sha256:...) for
# byte-for-byte reproducible builds.
ARG NODE_IMAGE=node:24-bookworm-slim

# ---- Install dependencies and build ---------------------------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    CI=true

# Corepack reads the pnpm version from the packageManager field.
RUN corepack enable

# `postinstall` runs `prisma generate`, so the schema and config must be present
# before install. Everything else is copied after, to keep this layer cached.
COPY package.json pnpm-lock.yaml .npmrc ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY scripts/prisma-generate-if-available.mjs ./scripts/prisma-generate-if-available.mjs
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
# Do not call `pnpm build`: it applies migrations, which must not run at image
# build time. The container entrypoint applies them at start.
RUN pnpm exec prisma generate && pnpm exec next build

# Resolve the exact Prisma CLI version from the lockfile so the migration
# runner below always matches the version the app was built and tested with.
RUN set -eu; \
    version="$(sed -n 's/^  prisma@\([0-9][0-9.]*\)[(:].*/\1/p' pnpm-lock.yaml | head -n 1)"; \
    test -n "$version" || { echo "Could not read the prisma version from pnpm-lock.yaml" >&2; exit 1; }; \
    mkdir -p /migrate; \
    printf '{"name":"pulse360-migrate","private":true,"dependencies":{"prisma":"%s"}}\n' "$version" > /migrate/package.json

# ---- Migration runner (Prisma CLI only; not part of the standalone output) --
FROM ${NODE_IMAGE} AS migrate
WORKDIR /migrate
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /migrate/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund --ignore-scripts=false
COPY prisma.config.ts ./
COPY prisma ./prisma

# ---- Runtime ----------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=migrate --chown=node:node /migrate /app/migrate
COPY --chown=node:node scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
# Strip CRs in case the file was checked out with Windows line endings.
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
