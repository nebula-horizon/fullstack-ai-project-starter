# 🚀 Fullstack Vibe-Coding Template

Welcome! This is an elite, single-language (TypeScript) monorepo starter kit designed specifically for building modern fullstack web applications and AI-powered services. 

It is completely optimized for **autonomous AI developer agents** ("vibe coding") and built with ultra-fast compilations, hermetic developer toolchains, and strict, compile-time type-safe boundaries.

Company projects created from this starter also follow an internal engineering guide, which reaches Claude Code through an organization-managed plugin.

> **🔒 Production access:** nobody has standing access to production (the prod AWS account, the prod Supabase account, or prod secrets). Changes reach prod only through CI with a required reviewer. If you need temporary access, **contact the admin**, who grants it manually and revokes it afterwards. **Never give an AI agent production credentials.** Details: [docs/security/production-access.md](./docs/security/production-access.md).

---

## 🛠️ Technology Stack

- **Frontend & Gateway (SSR):** [TanStack Start](https://tanstack.com/start/latest) — Vite-based SSR React framework with file-based routing, server functions (`createServerFn`), and type-safe state hydration.
- **Backend API (Clean Architecture):** [AdonisJS v6](https://adonis.dev) — Node-native MVC framework configured as a robust, ESM-only headless REST API.
- **Database & Auth Orchestration:** [Supabase local CLI](https://supabase.com) — Powered by local Docker sibling containers managing Postgres, local Studio UI, Auth, and Storage.
- **ORM & Query Builder:** [Kysely](https://kysely.dev) — Type-safe, autocompiling SQL builder mapping database types generated natively by Supabase.
- **Contract Code-Gen:** [openapi-typescript](https://openapi-ts.dev) & [openapi-react-query](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-react-query) — 100% type-safe endpoint autocomplete with zero manual fetching boilerplate.
- **Formatting & Linting:** [Biome](https://biomejs.dev) — C-speed native formatter and linter managed via Mise. Enforces path alias imports (`@/` in apps/web) to maintain clean, maintainable import paths across the monorepo.
- **Toolchain & Runner:** [Mise-en-place](https://mise.en.dev) — Hermetic manager controlling local Node.js, Biome, Supabase CLI and OpenTofu binaries.
- **Deployment:** AWS (ECS Fargate behind an ALB) via [OpenTofu](https://opentofu.org) in `tools/infra/aws` and GitHub Actions with OIDC (no AWS keys in GitHub). Two environments, `dev` and `prod`, in separate AWS accounts and separate Supabase accounts.

---

## 📂 Monorepo Structure

```text
.
├── AGENTS.md                  # Strict AI guidelines & prompt profiles
├── CLAUDE.md                  # Loads AGENTS.md for Claude Code
├── CODEOWNERS                 # Who reviews which path (placeholder teams)
├── .mise/                     # Root-level Mise tasks
├── .github/workflows/         # CI/CD: infrastructure, deploy-api, deploy-web, database, repo-checks
├── .ci/scripts/               # Scripts the workflows call (plan gate, health check)
├── apps/
│   ├── web/                   # TanStack Start Web Application
│   └── api/                   # AdonisJS v6 Backend REST API
├── packages/
│   ├── db/                    # Shared Kysely database types
│   └── contracts/             # Auto-compiled OpenAPI contracts
├── tools/
│   ├── infra/aws/             # OpenTofu root module + environments/{dev,prod}.tfvars
│   └── supabase/              # Supabase CLI configs & DDL migrations
├── openspec/specs/            # Testable specs (deployment, migrations)
├── docs/                      # Hierarchical Project Documentation
├── docker-compose.yml         # Container configuration (Web, API)
├── mise.toml                  # Global tool versions & task list
├── pnpm-lock.yaml             # The one lockfile (pnpm only)
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
Each app has its own git-ignored `.env`, copied from its `.env.example` (names and shapes only):
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm install
(cd apps/api && node --import tsx ace.js generate:key)   # writes a per-machine APP_KEY into apps/api/.env
```
After step 4, put the local anon key from `mise run db:status` into `apps/web/.env`. The service-role key never goes into `apps/web`. Full recipe: [docs/workflows/local-setup.md](./docs/workflows/local-setup.md); where every key lives: [docs/security/secrets-inventory.md](./docs/security/secrets-inventory.md).

Personal editor files (`.vscode/`, `.idea/`) are not in the repo's `.gitignore`. Add them to your global gitignore.

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

## 🚢 Environments & Deployment

| | dev | prod |
| --- | --- | --- |
| Branch | `dev` | `main` |
| AWS account / Supabase account | separate | separate |
| Deploys | automatically on merge | after a required reviewer approves |

Branch from `dev`, open PRs into `dev`, verify in dev, then promote with a PR from `dev` into `main`. All deploys run in GitHub Actions. `tofu apply`, `supabase db push` and image pushes never run from a laptop.

- Infrastructure and release path: [docs/deployment/aws.md](./docs/deployment/aws.md)
- Migrations dev → prod: [docs/workflows/database-migrations.md](./docs/workflows/database-migrations.md)
- Supabase accounts per environment: [docs/database/overview.md](./docs/database/overview.md); secrets by name: [docs/security/secrets-inventory.md](./docs/security/secrets-inventory.md)

**Starting a project from this template:** replace every `<placeholder>` (`<org>`, `<product>`, `<account-id-…>`, `<team-…>`) in `CODEOWNERS` and `tools/infra/aws/environments/*.tfvars`, create the `dev` branch, then follow the bootstrap order in [docs/deployment/aws.md §5](./docs/deployment/aws.md#5-bootstrapping-an-environment).

---

## 📝 Documenting Your Progress
All project architecture, guides, and workflows are stored under `/docs`. Refer to `/docs/index.md` for a complete index of directories.
