# Multi-stage build for Ctrl-Alt-Play Panel
# Uses Alpine Linux for smaller image size but maintains compatibility

# Frontend build stage
FROM node:18-alpine AS frontend-builder

# Install system dependencies for building (cross-platform)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Backend build stage  
FROM node:18-alpine AS backend-builder

# Install system dependencies for building (cross-platform)
RUN apk add --no-cache \
    openssl \
    python3 \
    make \
    g++ \
    curl \
    && ln -sf python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy package files and configs
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev for building)
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies (Linux distribution agnostic)
RUN apk add --no-cache \
    openssl \
    curl \
    tini \
    ca-certificates \
    && update-ca-certificates

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy Prisma schema and generate client for runtime
COPY prisma ./prisma
RUN npx prisma generate

# Copy built application from backend builder stage
COPY --from=backend-builder /app/dist ./dist

# Copy built frontend from frontend builder stage
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Copy any additional static files
COPY uploads ./uploads

# Create non-root user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -S -u 1001 -G appuser appuser

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/uploads /app/data && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 3000 8080

# Health check using node directly (cross-platform)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node dist/health-check.js || exit 1

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["npm", "start"]
