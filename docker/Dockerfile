FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# --- Builder ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma v7: needs both prisma/ schema and prisma.config.ts to generate the client
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app

# curl is needed for the health check probe
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js standalone output (includes a minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Generated Prisma client (src/generated/prisma/)
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Prisma CLI + schema needed by the entrypoint to run `prisma db push`
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# BullMQ and ioredis (pure JS — needed at runtime for background job processing)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bullmq ./node_modules/bullmq
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ioredis ./node_modules/ioredis

# Entrypoint: runs db push then starts the server
COPY --chown=nextjs:nodejs docker/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
