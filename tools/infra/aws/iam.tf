# Runtime roles for the ECS tasks.
#   execution role — what ECS itself needs to start the task: pull the image,
#                    write logs, and resolve the secret/parameter ARNs.
#   task role      — what the running app may call. Empty today; grant per need.

data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_execution" {
  for_each = local.apps

  name               = "${local.name_prefix}-${each.key}-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  for_each = local.apps

  role       = aws_iam_role.ecs_execution[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Only the API's execution role can read the API's runtime secret. The web
# execution role gets nothing beyond image pull and logs.
data "aws_iam_policy_document" "api_execution_secrets" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.api_runtime.arn]
  }
  statement {
    actions   = ["ssm:GetParameters"]
    resources = [aws_ssm_parameter.supabase["url"].arn]
  }
}

resource "aws_iam_role_policy" "api_execution_secrets" {
  name   = "read-runtime-secrets"
  role   = aws_iam_role.ecs_execution["api"].id
  policy = data.aws_iam_policy_document.api_execution_secrets.json
}

resource "aws_iam_role" "ecs_task" {
  for_each = local.apps

  name               = "${local.name_prefix}-${each.key}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}
