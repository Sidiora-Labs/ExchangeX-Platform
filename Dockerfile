# syntax=docker/dockerfile:1

# ExchangeX — multi-stage build producing one image that can run either
# process. Pick which with the container command:
#   frontend:  pnpm start:frontend
#   backend:   pnpm start:backend
#
# uWebSockets.js is a native addon installed from GitHub, and sharp/argon2 are
# native too, so the build stage needs a toolchain. The runtime stage does not.

ARG NODE_VERSION=22-bookworm-slim

# ---------------------------------------------------------------- deps
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY packages ./packages

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# --------------------------------------------------------------- build
FROM deps AS build
WORKDIR /app

COPY . .

# Next.js inlines NEXT_PUBLIC_* at build time, so they must be present here,
# not just at runtime. Pass them with --build-arg.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_BACKEND_PORT
ARG NEXT_PUBLIC_FRONTEND_PORT
ARG NEXT_PUBLIC_DEFAULT_LANGUAGE
ARG NEXT_PUBLIC_DEFAULT_THEME

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build:all

# ------------------------------------------------------------- runtime
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

# Run unprivileged. node:* images already ship a `node` user (uid 1000).
RUN mkdir -p /app/logs /app/public/uploads && chown -R node:node /app

COPY --from=deps  --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next        ./.next
COPY --from=build --chown=node:node /app/dist         ./dist
COPY --from=build --chown=node:node /app/public       ./public
COPY --from=build --chown=node:node /app/models       ./models
COPY --from=build --chown=node:node /app/seeders      ./seeders
COPY --from=build --chown=node:node \
     /app/package.json /app/next.config.mjs /app/config.js \
     /app/next-i18next.config.js /app/module-alias-setup.ts ./

USER node

EXPOSE 3000 4000

# The only /api/.../health route is an auth-gated admin diagnostic that calls
# out to Stripe/Twilio/Cassandra, so it is unsuitable as a probe. Check that the
# port is accepting connections instead. HEALTHCHECK_PORT: 4000 backend, 3000 frontend.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('net').connect(Number(process.env.HEALTHCHECK_PORT)||4000,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["pnpm", "start:backend"]
