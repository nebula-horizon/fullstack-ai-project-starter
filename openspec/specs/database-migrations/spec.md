# database-migrations Specification

## Purpose
How the Postgres schema in `tools/supabase/migrations` reaches the local stack,
then the dev Supabase account, then the prod Supabase account. Human-readable
detail lives in `docs/workflows/database-migrations.md` and
`docs/database/overview.md` and `docs/security/secrets-inventory.md`.

## Requirements

### Requirement: Migrations are the only source of schema change
Every schema change SHALL be a timestamped SQL file in `tools/supabase/migrations/` named `<YYYYMMDDHHMMSS>_<name>.sql`. No schema change SHALL be made in a Supabase dashboard without a matching migration.

#### Scenario: A migration file is not picked up
- **WHEN** a file in `tools/supabase/migrations/` does not match the CLI's naming rule (e.g. `00000000000000_init.sql`)
- **THEN** the Supabase CLI skips it, so such names SHALL NOT be committed

### Requirement: Migrations are verified on every pull request
The `database` workflow SHALL apply every migration to an empty local Postgres and lint the schema on each pull request touching `tools/supabase/**`, without any cloud credentials.

#### Scenario: A migration fails to apply
- **WHEN** a pull request adds a migration that errors on an empty database
- **THEN** the `verify` job SHALL fail

### Requirement: Migrations reach dev then prod through CI only
Migrations SHALL be applied to the dev Supabase account on push to `dev`, and to the prod Supabase account on push to `main` after a required reviewer approves the `prod` Environment. Nobody SHALL run `supabase db push` against dev or prod from a laptop.

#### Scenario: Promotion to prod
- **WHEN** migrations are merged from `dev` into `main`
- **THEN** the `migrate` job SHALL dry-run, wait for approval, then apply them to the prod account

### Requirement: Separate Supabase accounts per environment
Dev and prod SHALL use separate Supabase accounts, not two projects in one account. Each environment's connection strings and keys SHALL be stored only in that environment's AWS account, in Secrets Manager (the URL, which is not a key, in SSM).

#### Scenario: Dev credentials leak
- **WHEN** a dev Supabase credential is exposed
- **THEN** it SHALL give no access to the prod Supabase account

### Requirement: Service-role key never reaches the browser
The Supabase service-role key SHALL exist only in the API's Secrets Manager secret. It SHALL NOT appear in `apps/web`, in any `VITE_*` variable, in a Docker build argument, or in git.

#### Scenario: Web image is built
- **WHEN** `deploy-web` builds the web image
- **THEN** it SHALL pass no Supabase value at all; the web server reads the URL and anon key from its environment at runtime

### Requirement: Backward-compatible migrations
Because migrations and app deploys run as separate workflows, each migration SHALL be compatible with the app version currently running (expand first, deploy, then contract in a later change).

#### Scenario: Dropping a column
- **WHEN** a column is no longer needed
- **THEN** the app change that stops reading it SHALL ship before the migration that drops it
