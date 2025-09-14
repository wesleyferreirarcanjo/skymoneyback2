# Production stage
FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create uploads directory
RUN mkdir -p uploads && chown -R nestjs:nodejs uploads

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
