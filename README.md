# 🚀 Fullstack Vibe-Coding Template

Welcome! This is an elite, single-language (TypeScript) monorepo starter kit designed specifically for building modern fullstack web applications and AI-powered services. 

It is completely optimized for **autonomous AI developer agents** ("vibe coding") and built with ultra-fast compilations, hermetic developer toolchains, and strict, compile-time type-safe boundaries.

---

## 🛠️ Technology Stack

- **Frontend & Gateway (SSR):** [TanStack Start](https://tanstack.com/start/latest) — Vite-based SSR React framework with file-based routing, server functions (`createServerFn`), and type-safe state hydration.
- **Backend API (Clean Architecture):** [AdonisJS v6](https://adonis.dev) — Node-native MVC framework configured as a robust, ESM-only headless REST API.
- **Database & Auth Orchestration:** [Supabase local CLI](https://supabase.com) — Powered by local Docker sibling containers managing Postgres, local Studio UI, Auth, and Storage.
- **ORM & Query Builder:** [Kysely](https://kysely.dev) — Type-safe, autocompiling SQL builder mapping database types generated natively by Supabase.
- **Contract Code-Gen:** [openapi-typescript](https://openapi-ts.dev) & [openapi-react-query](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-react-query) — 100% type-safe endpoint autocomplete with zero manual fetching boilerplate.
- **Formatting & Linting:** [Biome](https://biomejs.dev) — C-speed native formatter and linter managed via Mise. Enforces path alias imports (`@/` in apps/web) to maintain clean, maintainable import paths across the monorepo.
- **Toolchain & Runner:** [Mise-en-place](https://mise.en.dev) — Hermetic manager controlling local Node.js, Biome, and Supabase binaries.

---

## 📂 Monorepo Structure

```text
.
├── AGENTS.md                  # Strict AI guidelines & prompt profiles
├── .mise/                     # Root-level Mise tasks
├── apps/
│   ├── web/                   # TanStack Start Web Application
│   └── api/                   # AdonisJS v6 Backend REST API
├── packages/
│   ├── db/                    # Shared Kysely database types
│   └── contracts/             # Auto-compiled OpenAPI contracts
├── tools/
│   └── supabase/              # Supabase CLI configs & DDL migrations
├── docs/                      # Hierarchical Project Documentation
├── docker-compose.yml         # Container configuration (Web, API)
├── mise.toml                  # Global tool versions & task list
└── pnpm-workspace.yaml        # Workspace package definitions
```

---

## ⚡ Quick Start

### 1. Prerequisites
Install these on your host machine before you start:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** — must be **installed and running**. The local Supabase stack (Postgres, Studio, Auth, Storage) runs as Docker sibling containers.
- **[Mise](https://mise.jdx.dev/getting-started.html)** — the hermetic toolchain manager. It installs and pins the rest of the toolchain (Node.js, Biome, and the Supabase CLI) directly from `mise.toml`.
- **A coding agent** — this template is built for autonomous AI development ("vibe coding"). Use [Claude Code](https://claude.com/claude-code), [Cursor](https://cursor.com), or [opencode](https://opencode.ai). Agents read [`AGENTS.md`](./AGENTS.md) for the project's strict conventions.

### 2. Install the Toolchain
Trust the repo config and install the pinned tools (Node.js, Biome, Supabase CLI) from `mise.toml`:
```bash
mise trust
mise install
```

### 3. Workspace Setup
Initialize your environment variables and install all workspace packages:
```bash
cp .env.example .env
pnpm install
```

### 4. Start Local Supabase Database
Spin up the local Supabase Postgres instance, migrations, and Web Studio:
```bash
supabase start --workdir tools
```
*Port Maps:*
- Postgres Database: `127.0.0.1:54332`
- Supabase Studio Web UI: `http://127.0.0.1:54328`
- API Gateway (Kong): `http://127.0.0.1:54326`
- Email Testing UI (Mailpit): `http://127.0.0.1:54324`

### 5. Run Development Servers
Start both the AdonisJS backend API and TanStack Start frontend in development mode:
```bash
mise run dev
```
*Application URLs:*
- TanStack Web App: `http://localhost:3000`
- AdonisJS Backend API: `http://localhost:3333`

---

## 🛠️ Global Tasks Checklist

Manage your whole workspace from the root using these fast, Mise-managed commands:
- **`mise run dev`**: Spin up both frontend and backend development environments in parallel.
- **`mise run build`**: Compile all workspace packages and application targets.
- **`mise run format`**: Format all codebase folders instantly using Biome.
- **`mise run test`**: Execute the Japa integration test suite on the backend.
- **`mise run typecheck`**: Run static TypeScript analysis across all workspaces.

---

## 📝 Documenting Your Progress
All project architecture, guides, and workflows are stored under `/docs`. Refer to `/docs/index.md` for a complete index of directories.
