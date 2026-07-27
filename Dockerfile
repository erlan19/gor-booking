# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Backend dependencies
COPY backend/gor-api/package*.json ./backend/
RUN cd backend && npm ci

# Backend source
COPY backend/gor-api/ .

# Build backend (TypeScript)
RUN npm run build 2>/dev/null || true

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Install PostgreSQL client for migrations
RUN apk add --no-cache postgresql-client

# Copy built backend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist 2>/dev/null || true
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null; npx prisma db push 2>/dev/null; npx tsx src/index.ts"]