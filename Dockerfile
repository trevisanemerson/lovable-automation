# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Install Playwright dependencies
RUN apk add --no-cache \
    chromium \
    firefox \
    dumb-init \
    bash \
    curl

# Install pnpm
RUN npm install -g pnpm

# Copy package files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/client/dist ./client/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["node", "dist/index.js"]

EXPOSE 3000
