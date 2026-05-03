# Base image
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Dependencies stage
FROM base AS deps
WORKDIR /app
# Copy only package files to install dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
# Install all dependencies including devDependencies for build
RUN npm ci

# 2. Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# 3. Runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install required system dependencies for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl libssl3 && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 expressjs
USER expressjs

# Copy built files and necessary production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/package.json ./package.json

WORKDIR /app/apps/api
EXPOSE 4000
ENV PORT=4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node src/server.js"]
