# ─── Stage 1: Build dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ─── Stage 2: Production image ──────────────────────────────────────────────
FROM node:20-alpine AS runner

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Remove dev/config files not needed at runtime
RUN rm -f .env.example .gitignore README.md

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose the app port
EXPOSE 3000

# Health check — hits the root redirect
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Start the app
CMD ["node", "app.js"]
