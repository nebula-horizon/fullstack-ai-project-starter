# 🗄️ Database Overview

What data exists, who owns it, where personal data lives, and which Supabase holds it in each
environment. How to change the schema is in
[workflows/database-migrations.md](../workflows/database-migrations.md).

## 1. Schema

| Table | Owned by | Holds | Personal data |
| --- | --- | --- | --- |
| `auth.users` | Supabase Auth | Accounts, credentials, sign-in metadata | **Yes**: email, auth metadata. Managed by Supabase; the app never writes it directly |
| `public.profiles` | `apps/api` | One row per user: `id` (= `auth.users.id`), `email`, `full_name`, `created_at`. RLS on: anyone may read, a user may insert/update only their own row | **Yes**: email, full name |

A trigger (`on_auth_user_created`) creates the `profiles` row whenever Supabase Auth creates a user,
so that every signed-in user already has a profile for `/api/v1/users/me`.

The Kysely types for these tables are `packages/db/src/types.ts`, generated from the migrated schema
(see the migrations recipe).

## 2. Environments: one Supabase account each

| | local | dev | prod |
| --- | --- | --- | --- |
| What | Supabase CLI stack under `tools/supabase` (Docker) | Supabase cloud, **dev account** | Supabase cloud, **prod account** |
| Data | Synthetic | Synthetic or anonymised | Real |
| Schema arrives via | `mise run db:reset` | `database.yml` on push to `dev` | `database.yml` on push to `main`, after approval |
| Who can sign in | you | the team | **nobody standing** — [security/production-access.md](../security/production-access.md) |

Dev and prod live in **separate Supabase accounts** (rather than two projects under one account),
so someone with dev access has no route into production. Local development never uses a hosted account. Where each
environment's URL and keys are stored is in [security/secrets-inventory.md](../security/secrets-inventory.md).
