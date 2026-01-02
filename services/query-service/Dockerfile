# Multi-stage Dockerfile for Query Service
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
# Set dummy DATABASE_URL for Prisma client generation
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=${DATABASE_URL}
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm install && \
    npm cache clean --force
# Copy source code
COPY . .
# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate
# Build TypeScript
RUN npm run build
# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
# Copy built artifacts and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
# Switch to non-root user
USER nodejs
# Expose ports
EXPOSE 4000 9090
# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
# Start the service
CMD ["node", "dist/index.js"]
