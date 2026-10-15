# Values other tooling needs. The deploy workflows read the same names from SSM
# (ssm-config.tf) so nothing has to be copied into YAML by hand.

output "alb_dns_name" {
  description = "Point app_domain's DNS record (CNAME/alias) at this."
  value       = aws_lb.main.dns_name
}

output "github_actions_role_arns" {
  description = "Copy into the GitHub Environments: plan → <env>-plan, apply + deploy → <env>."
  value = {
    AWS_PLAN_ROLE_ARN   = aws_iam_role.github_actions_plan.arn
    AWS_ROLE_ARN        = aws_iam_role.github_actions_apply.arn
    AWS_DEPLOY_ROLE_ARN = aws_iam_role.github_actions_deploy.arn
  }
}

output "secret_arns" {
  description = "Containers to fill out of band — the values are never managed here."
  value = {
    api_runtime         = aws_secretsmanager_secret.api_runtime.arn
    supabase_migrations = aws_secretsmanager_secret.supabase_migrations.arn
    web_build           = aws_secretsmanager_secret.web_build.arn
  }
}

output "supabase_parameter_names" {
  description = "Set from this environment's Supabase account (non-secret, tier 2)."
  value       = { for k, p in aws_ssm_parameter.supabase : k => p.name }
}

output "ecr_repository_urls" {
  value = { for k, r in aws_ecr_repository.app : k => r.repository_url }
}
