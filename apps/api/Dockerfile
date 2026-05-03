# Base image
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Production dependencies stage
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --omit=dev

# 2. Full dependencies stage (for Prisma generation)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

# 3. Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# 4. Runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install required system dependencies for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl libssl3 && rm -rf /var/lib/apt/lists/*

# Copy production dependencies and built files
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/package.json ./package.json

# Create non-root user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 expressjs

# Make Prisma directories writable for runtime migrations
RUN chown -R expressjs:nodejs /app/node_modules/@prisma

USER expressjs

WORKDIR /app/apps/api
EXPOSE 4000
ENV PORT=4000

CMD ["sh", "-c", "echo 'Running migrations...' && /app/node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma && echo 'Seeding database...' && node prisma/seed.js && echo 'Starting server...' && node src/server.js"]
