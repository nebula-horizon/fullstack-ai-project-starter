# Non-secret configuration in SSM Parameter Store. Two kinds live here:
#
# 1. The per-environment Supabase project URL. Not a key and not secret, but it
#    belongs to a Supabase account outside this module, so OpenTofu only creates
#    the parameter and a human sets the value. Supabase KEYS are secrets and
#    live in secrets.tf.
#
# 2. Deploy hand-off names: the application workflows read these instead of
#    hard-coding resource names or ARNs in YAML.

resource "aws_ssm_parameter" "supabase" {
  for_each = toset(["url"])

  name  = "${local.ssm_prefix}/supabase/${each.key}"
  type  = "String"
  value = "set-out-of-band" # initial value only

  lifecycle {
    ignore_changes = [value] # set by a human from this env's Supabase account
  }
}

locals {
  deploy_parameters = merge(
    {
      "base-url"              = "https://${var.app_domain}"
      "ecs-cluster"           = aws_ecs_cluster.main.name
      "migrations-secret-arn" = aws_secretsmanager_secret.supabase_migrations.arn
      "web-build-secret-arn"  = aws_secretsmanager_secret.web_build.arn
    },
    merge([
      for app in keys(local.apps) : {
        "${app}/ecr-repository" = aws_ecr_repository.app[app].name
        "${app}/ecs-service"    = aws_ecs_service.app[app].name
        "${app}/task-family"    = aws_ecs_task_definition.app[app].family
        "${app}/container-name" = app
      }
    ]...)
  )
}

resource "aws_ssm_parameter" "deploy" {
  for_each = local.deploy_parameters

  name  = "${local.ssm_prefix}/deploy/${each.key}"
  type  = "String"
  value = each.value # owned by IaC entirely — no ignore_changes
}
