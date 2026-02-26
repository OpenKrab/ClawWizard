# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
# We don't strictly need a build here if we are running dev mode, 
# but let's keep it for completeness if we wanted to change to production mode later.
# RUN npm run build

# Runtime stage
FROM node:22-slim

WORKDIR /app

# Install openclaw globally so the bridge can use it
RUN npm install -g openclaw@latest

# Copy built files and dependencies from builder
COPY --from=builder /app /app

# Expose Vite dev port and Bridge port
EXPOSE 5173
EXPOSE 18790

# Environmental variable to ensure openclaw knows where to look 
# (though it defaults to ~/.openclaw anyway)
ENV OPENCLAW_DIR=/root/.openclaw

# Run dev mode (Vite + Bridge concurrently)
CMD ["npm", "run", "dev", "--", "--host"]
