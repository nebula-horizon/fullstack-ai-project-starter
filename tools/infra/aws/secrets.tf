# Secrets live in AWS Secrets Manager. OpenTofu creates the empty containers;
# an admin writes the values by hand, from the Supabase account that belongs to
# THIS environment (dev and prod are separate Supabase accounts). Values never
# enter git, a plan, GitHub, or a chat. Inventory: docs/security/secrets-inventory.md.
#
# There is deliberately no aws_secretsmanager_secret_version resource. Every
# plan refreshes a version resource, which would copy the real value into the
# state file and require the read-only plan role to read secret values — and
# that role can be assumed from any pull request.
#
# Value contract (set with `aws secretsmanager put-secret-value`, JSON):
#   api-runtime          {"APP_KEY","DATABASE_URL","JWT_SECRET","SUPABASE_SERVICE_ROLE_KEY"}
#   supabase-migrations  {"DATABASE_URL"}
#   web-runtime          {"SUPABASE_ANON_KEY"}
# The API's ECS tasks cannot start until api-runtime holds a value; on a new
# environment, apply first, then write the values, then deploy the apps.

# Read by the API at task start (ECS injects each key by ARN — see ecs.tf).
resource "aws_secretsmanager_secret" "api_runtime" {
  name        = "${local.name_prefix}/api-runtime"
  description = "apps/api runtime secrets. Owner: <team-backend>. Rotate: 90 days and on exposure."

  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  lifecycle {
    prevent_destroy = true
  }
}

# Read ONLY by the database migration job (.github/workflows/database.yml).
# Separate from the runtime secret so the running API never holds the
# migration connection and the migration job never holds the API's keys.
resource "aws_secretsmanager_secret" "supabase_migrations" {
  name        = "${local.name_prefix}/supabase-migrations"
  description = "Connection string CI uses to apply tools/supabase/migrations. Owner: <team-platform>."

  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  lifecycle {
    prevent_destroy = true
  }
}

# Read by the web app's ECS tasks at start. Every Supabase key is kept in
# Secrets Manager, the anon key included, even though Supabase designs it to be
# usable in a browser: the web server hands it to the page at runtime, so it is
# never baked into an image.
resource "aws_secretsmanager_secret" "web_runtime" {
  name        = "${local.name_prefix}/web-runtime"
  description = "Supabase anon key for apps/web. Owner: <team-frontend>. Never the service-role key."

  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  lifecycle {
    prevent_destroy = true
  }
}
