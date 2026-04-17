# =============================================================================
# Project Sentinel - Multi-Stage Dockerfile
# =============================================================================
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
# Isolates dependency installation for better layer caching.
# Dependencies are cached unless package.json or package-lock.json change.
# =============================================================================

FROM node:20-alpine AS deps

# Install system dependencies required by systeminformation package
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Copy dependency manifests only (for caching)
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --only=production && \
    npm cache clean --force

# =============================================================================
# Stage 2: Builder
# -----------------------------------------------------------------------------
# Compiles TypeScript source code.
# Uses dependencies from deps stage for caching.
# =============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy lock file and install dependencies
COPY package.json package-lock.json* ./
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Type-check without emitting (caught in CI)
RUN npm run type-check

# Build TypeScript to JavaScript
RUN npm run build

# =============================================================================
# Stage 3: Production
# -----------------------------------------------------------------------------
# Minimal runtime image with only production dependencies and compiled code.
# Reduces attack surface and image size significantly.
# =============================================================================

FROM node:20-alpine AS production

# Security: Run as non-root user
RUN addgroup -g 1001 -S sentinel && \
    adduser -S sentinel -u 1001 -G sentinel

WORKDIR /app

# Install production dependencies only (fresh install in minimal image)
COPY package.json package-lock.json* ./
RUN npm ci --only=production --omit=dev && \
    npm cache clean --force

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Set proper ownership
RUN chown -R sentinel:sentinel /app

# Switch to non-root user
USER sentinel

# Expose port if needed (for potential API mode)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('child_process').execSync('node dist/index.js --version', {stdio: 'inherit'})" || exit 1

# Set NODE_ENV for production optimizations
ENV NODE_ENV=production

# Default command
CMD ["node", "dist/index.js"]
