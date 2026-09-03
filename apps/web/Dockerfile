# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
ENV CI=true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
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
ARG NEXT_PUBLIC_API_URL=https://school.adam.delpozodelvalle.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p /app/apps/web/public
RUN pnpm --filter @universidad/web build

FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3180 \
    HOSTNAME=0.0.0.0 \
    HOME=/tmp \
    TMPDIR=/tmp
RUN groupadd --system --gid 1001 universidad \
  && useradd --system --uid 1001 --gid universidad --create-home universidad \
  && mkdir -p /tmp \
  && chown universidad:universidad /tmp
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build --chown=universidad:universidad /app/apps/web/.next/standalone ./
COPY --from=build --chown=universidad:universidad /app/apps/web/.next/static ./apps/web/.next/static
USER universidad
EXPOSE 3180
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3180)+'/').then((r)=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
STOPSIGNAL SIGTERM
CMD ["node", "apps/web/server.js"]
