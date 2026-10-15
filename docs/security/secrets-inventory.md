# 🔐 Secrets Inventory

One row per secret or key the product uses — its **name**, its **storage** location per environment,
what it **unlocks**, and the rotation **owner**. Values are never written here, dev ones included. New engineers use it to set up a local `.env` (no values are ever shared over chat), and incident
responders use it to see what needs rotating.

## 1. Inventory

`<product>` and `<env>` are placeholders; `<env>` is `dev` or `prod`, each in its own AWS account.

| Name | Opens | Local (`.env`, git-ignored) | dev / prod storage | Read by | Owner |
| --- | --- | --- | --- | --- | --- |
| `APP_KEY` | AdonisJS encryption/signing | `apps/api/.env`, generated per machine | Secrets Manager `<product>-<env>/api-runtime` → `APP_KEY` | API (ECS, by ARN) | `<team-backend>` |
| `DATABASE_URL` (API) | Supabase Postgres via the pooler | `apps/api/.env` (local CLI default) | `…/api-runtime` → `DATABASE_URL` | API | `<team-backend>` |
| `JWT_SECRET` | Verifies Supabase access tokens; anyone holding it can mint them | `apps/api/.env` (local CLI default) | `…/api-runtime` → `JWT_SECRET` | API | `<team-backend>` |
| `SUPABASE_SERVICE_ROLE_KEY` | Full Supabase access, **bypasses row-level security** | `apps/api/.env`, optional | `…/api-runtime` → `SUPABASE_SERVICE_ROLE_KEY` | API only | `<team-backend>` |
| `SUPABASE_ANON_KEY` | Public Supabase client access (RLS applies) | `apps/web/.env` as `VITE_SUPABASE_ANON_KEY` | Secrets Manager `<product>-<env>/web-build` → `SUPABASE_ANON_KEY` | `deploy-web` at image build | `<team-frontend>` |
| `DATABASE_URL` (migrations) | Supabase Postgres, schema changes | — (local uses the CLI) | Secrets Manager `<product>-<env>/supabase-migrations` → `DATABASE_URL` | `database.yml` only | `<team-platform>` |
| Supabase URL *(not secret)* | — | `apps/*/.env` | SSM `/<product>/<env>/supabase/url` | API (ECS), `deploy-web` | `<team-platform>` |

GitHub holds **no** secrets for this product: CI reaches AWS through OIDC, with only role ARNs as
variables.

## 2. Rules

- **Values are written by a person, out of band**, from the Supabase account of *that* environment,
  with `aws secretsmanager put-secret-value` in their own shell, never through chat, a ticket, a PR or
  an AI session. OpenTofu creates the empty containers only (`tools/infra/aws/secrets.tf`), so
  values never reach git, a plan or the state file.
- **The service-role key never reaches the browser.** It is not in `apps/web`, any `VITE_*`
  variable, a Docker build arg, or the web task definition, because it bypasses row-level security.
  Only the API's execution role can read `api-runtime`.
- **Only dev values outside production.** Local `.env` files, the dev environment and any AI agent's
  environment never contain a production value
  ([production-access.md](./production-access.md)).
- **`.env.example` files carry names and shapes only.** The two concrete values in
  `apps/api/.env.example` are the public defaults of the **local** Supabase CLI stack.

## 3. Adding or rotating a secret

- **Add:** add the container in `tools/infra/aws/secrets.tf`, its name to the matching
  `.env.example`, and a row above, in one PR. After CI applies it, the owner writes the value.
- **Rotate:** every 90 days, the same day someone with access leaves, and immediately on exposure.
  Rotate in Supabase, write the new value, then redeploy the reader (the API restarts to pick it up;
  web needs a rebuild for the anon key).
- **Exposed:** rotate first, then check access logs for the old value, then clean up. Deleting it from git does not make it safe.
