# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates wget \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS deps
ENV CI=true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile

FROM base AS build
ENV CI=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile
RUN pnpm --filter @universidad/shared build
RUN pnpm --filter @universidad/api exec prisma generate
RUN pnpm --filter @universidad/api build

FROM base AS runner
ENV NODE_ENV=production \
    PORT=4180 \
    HOME=/tmp \
    TMPDIR=/tmp
RUN groupadd --system --gid 1001 universidad \
  && useradd --system --uid 1001 --gid universidad --create-home universidad \
  && mkdir -p /data \
  && chown -R universidad:universidad /data /app
COPY --from=build --chown=universidad:universidad /app ./
COPY --chown=universidad:universidad docker/api-entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod 0555 /entrypoint.sh
WORKDIR /app/apps/api
USER universidad
EXPOSE 4180
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://127.0.0.1:4180/api/salud >/dev/null || exit 1
STOPSIGNAL SIGTERM
ENTRYPOINT ["/entrypoint.sh"]
