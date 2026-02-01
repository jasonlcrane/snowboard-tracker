# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .

# Build client and server
RUN pnpm build

# Runner stage
FROM node:20-slim AS runner

WORKDIR /app

# Install dependencies required for Puppeteer
# Note: We skip downloading Chromium via puppeteer install because we install it via apt,
# but puppeteer still needs to know where it is or we install chrome-linux
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Enable corepack
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
# Copy backend source if needed or if bundle included everything (esbuild bundled server)
# The build script: "esbuild server/_core/index.ts ... --outdir=dist"
# So we just need dist/index.js logs etc.

EXPOSE 3000

CMD ["node", "dist/index.js"]
