# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

WORKDIR /app

# Copy workspace manifests for layer cache (context = repo root)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/

# Install only api workspace deps
RUN pnpm install --filter api --frozen-lockfile

# Copy api source and compile
COPY api/tsconfig.json ./api/
COPY api/src/ ./api/src/
WORKDIR /app/api
RUN pnpm exec tsc

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:24-alpine AS production

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

WORKDIR /app

# Copy workspace manifests and install ONLY production deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
RUN pnpm install --filter api --frozen-lockfile --prod

# Copy compiled JS from builder
COPY --from=builder /app/api/dist ./api/dist

# Non-root user for security (OWASP: least privilege)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app/api
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
