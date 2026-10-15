# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22.22.3-alpine3.23 AS builder

WORKDIR /app

# Copy root monorepo settings and workspaces
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db ./packages/db/
COPY packages/contracts ./packages/contracts/
COPY apps/web ./apps/web/

# Upgrade OS packages and install build tools
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache make gcc g++ python3

# Install pnpm and dependencies
RUN npm install -g pnpm@9.15.9 && pnpm install --frozen-lockfile

# Build shared dependencies and web app
RUN pnpm --filter @template/db run build
RUN pnpm --filter @template/contracts run build
RUN pnpm --filter @template/web run build

# ── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22.22.3-alpine3.23 AS runner

WORKDIR /app

# Copy build assets
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/db/package.json /app/packages/db/
COPY --from=builder /app/packages/db/dist /app/packages/db/dist/
COPY --from=builder /app/packages/contracts/package.json /app/packages/contracts/
COPY --from=builder /app/packages/contracts/dist /app/packages/contracts/dist/
COPY --from=builder /app/apps/web/dist ./apps/web/dist/
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Upgrade OS packages in final runtime layer
RUN apk update && apk upgrade --no-cache

# Register pnpm global bin in PATH (adding both home and bin paths to be 100% failsafe)
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PNPM_HOME/bin:$PATH"

# Install production dependencies and patch global/local picomatch for CVE-2026-33671
RUN npm install -g pnpm@9.15.9 && \
    pnpm install --frozen-lockfile && \
    npm install -g picomatch@4.0.4

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/apps/web
# Production server: srvx serves dist/client as static files and hands every
# other request to the TanStack Start server entry. It binds all interfaces and
# listens on $PORT.
CMD ["pnpm", "run", "start"]
