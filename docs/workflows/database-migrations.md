# 💾 Database Migrations Workflow

This document outlines the local database orchestration, migrations tracking, and TypeScript schema generation workflow utilizing the Supabase CLI.

---

## 1. Local Database Orchestration

We use the **Supabase local CLI** to orchestrate our development database stack. This boots a full Supabase ecosystem (Postgres, Studio UI, Auth, and Storage) inside container namespaces on your host machine.

The database files and migrations are managed inside `/tools/supabase/` as the single source of truth.

### Custom Dev Ports Map
To prevent port clashes with other local projects or running database daemons on your host, our CLI ports are strictly offset:
- **Postgres Database:** `127.0.0.1:54332`
- **Kong API Gateway (API):** `http://127.0.0.1:54326`
- **Supabase Studio Web Dashboard:** `http://127.0.0.1:54328`
- **Email Inbucket Web UI:** `http://127.0.0.1:54324`

---

## 2. Creating & Applying Migrations

All schema and table modifications MUST be written as raw, declarative DDL SQL files.

### Step 1: Create a new migration file
Generate a new, timestamped `.sql` template inside `tools/supabase/migrations/`:
```bash
supabase migration new <migration_name> --workdir tools
```

### Step 2: Write your DDL SQL
Edit the generated `.sql` file inside `tools/supabase/migrations/` (e.g. creating tables, defining foreign keys, or enabling row-level security).

### Step 3: Apply migrations locally
Push the migrations to your running local database instance:
```bash
supabase db reset --workdir tools
```
This forces a clean database reset, applies all migrations in chronological order, and seeds mock data.

---

## 3. TypeScript Types Generation

Once your database schema is modified, you **must** immediately regenerate the TypeScript type definitions so that our Kysely query builders inside the backend API stay in sync:

```bash
# From the root workspace, run the generator script:
pnpm --filter @template/db run gen-types
```
This triggers the Supabase local type compiler:
```bash
supabase gen types typescript --local --workdir tools > src/types.ts
```
And writes a typed database schema directly to `packages/db/src/types.ts`, which is exported across the entire monorepo.

---

## 4. Preventing Schema Drift
Before committing changes to Git, always run `supabase db diff --workdir tools` to check if you made any manual changes inside the Supabase local Studio (`54323`) that haven't been recorded in a migration file. This guarantees that your migrations directory remains the absolute, pristine source of truth.
