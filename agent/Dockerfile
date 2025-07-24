# Ctrl-Alt-Play Test Agent Dockerfile
FROM node:18-alpine

# Install dependencies for potential native modules and wget for health checks
RUN apk add --no-cache python3 make g++ wget

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev for building)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S agent && \
    adduser -S agent -u 1001 -G agent

# Change ownership
RUN chown -R agent:agent /app
USER agent

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${HEALTH_PORT:-8081}/health || exit 1

# Expose health check port
EXPOSE 8081

# Start the agent
CMD ["npm", "start"]
