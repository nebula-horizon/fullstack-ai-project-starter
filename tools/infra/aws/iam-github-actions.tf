# GitHub Actions → AWS via OIDC federation.
# No AWS access keys exist anywhere. One OIDC provider per account, and three
# CI roles per account:
#
#   plan    read-only; assumed by plan jobs in the `<env>-plan` Environment
#   apply   mutates infrastructure; assumed by the infrastructure apply job
#   deploy  narrow; assumed by app deploy + migration jobs
#
# Trust is pinned to the token's `sub` claim. Because every job in
# .github/workflows declares a GitHub Environment, GitHub issues that claim as
# "repo:<org>/<repo>:environment:<name>", so each role below trusts exactly one
# Environment name and nothing else (no wildcards).

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]

  # Required by the API but no longer used to validate GitHub's issuer, which
  # AWS now verifies through its own trust store. Treat it as a fixed value:
  # it is not a credential and needs no rotation.
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

locals {
  github_subject_prefix = "repo:${var.github_repository}:environment"
  state_bucket_arn      = "arn:aws:s3:::${var.tf_state_bucket}"
  state_key             = "${var.environment}/terraform.tfstate"
}

data "aws_iam_policy_document" "github_trust" {
  # One document per subject; the for_each below picks which.
  for_each = {
    plan   = "${local.github_subject_prefix}:${var.environment}-plan"
    apply  = "${local.github_subject_prefix}:${var.environment}"
    deploy = "${local.github_subject_prefix}:${var.environment}"
  }

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      # One exact subject. Never a bare ":*".
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [each.value]
    }
  }
}

# ── PLAN role — read-only ────────────────────────────────────────────────────

resource "aws_iam_role" "github_actions_plan" {
  name               = "${local.name_prefix}-github-actions-plan-role"
  assume_role_policy = data.aws_iam_policy_document.github_trust["plan"].json
}

resource "aws_iam_role_policy_attachment" "plan_read_only" {
  role       = aws_iam_role.github_actions_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

data "aws_iam_policy_document" "plan_state" {
  statement {
    actions   = ["s3:ListBucket"]
    resources = [local.state_bucket_arn]
  }
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${local.state_bucket_arn}/${local.state_key}"]
  }
  # S3 native locking (use_lockfile) writes a lock object even for `plan`.
  # This is the plan role's ONLY write, scoped to that one key.
  statement {
    actions   = ["s3:PutObject", "s3:DeleteObject"]
    resources = ["${local.state_bucket_arn}/${local.state_key}.tflock"]
  }
  # ReadOnlyAccess does not include secret VALUES; keep it that way.
  statement {
    effect    = "Deny"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "plan_state" {
  name   = "state-read-and-lock"
  role   = aws_iam_role.github_actions_plan.id
  policy = data.aws_iam_policy_document.plan_state.json
}

# ── APPLY role — mutates infrastructure ──────────────────────────────────────
#
# KNOWN GAP: starts from AdministratorAccess so a fresh
# project can converge. Owner: <team-platform>. Replace with a tag-scoped policy
# (aws:ResourceTag/Product = var.product) before the first production launch.

resource "aws_iam_role" "github_actions_apply" {
  name               = "${local.name_prefix}-github-actions-apply-role"
  assume_role_policy = data.aws_iam_policy_document.github_trust["apply"].json
}

resource "aws_iam_role_policy_attachment" "apply_admin" {
  role       = aws_iam_role.github_actions_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

data "aws_iam_policy_document" "apply_guardrails" {
  # Explicitly deny what CI must never do, whatever else it is granted.
  statement {
    effect    = "Deny"
    actions   = ["s3:DeleteBucket", "s3:PutBucketVersioning", "s3:DeleteBucketPolicy"]
    resources = [local.state_bucket_arn]
  }
  statement {
    effect = "Deny"
    actions = [
      "iam:CreateUser",
      "iam:CreateAccessKey",
      "iam:CreateLoginProfile",
    ]
    resources = ["*"]
  }
  statement {
    effect = "Deny"
    actions = [
      "iam:DetachRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:PutRolePolicy",
      "iam:AttachRolePolicy",
    ]
    resources = [aws_iam_role.github_actions_apply.arn]
  }
}

resource "aws_iam_role_policy" "apply_guardrails" {
  name   = "guardrails"
  role   = aws_iam_role.github_actions_apply.id
  policy = data.aws_iam_policy_document.apply_guardrails.json
}

# ── DEPLOY role — app images, ECS rollouts, migrations ───────────────────────

resource "aws_iam_role" "github_actions_deploy" {
  name               = "${local.name_prefix}-github-actions-deploy-role"
  assume_role_policy = data.aws_iam_policy_document.github_trust["deploy"].json
}

data "aws_iam_policy_document" "deploy" {
  statement {
    sid       = "EcrLogin"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
  statement {
    sid = "EcrPush"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeImages",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
    ]
    resources = [for r in aws_ecr_repository.app : r.arn]
  }
  statement {
    sid       = "EcsTaskDefinitions"
    actions   = ["ecs:DescribeTaskDefinition", "ecs:RegisterTaskDefinition"]
    resources = ["*"] # these two actions do not support resource-level scoping
  }
  statement {
    sid       = "EcsRollout"
    actions   = ["ecs:UpdateService", "ecs:DescribeServices"]
    resources = [for s in aws_ecs_service.app : s.id]
  }
  statement {
    sid     = "PassTaskRoles"
    actions = ["iam:PassRole"]
    resources = concat(
      [for r in aws_iam_role.ecs_execution : r.arn],
      [for r in aws_iam_role.ecs_task : r.arn],
    )
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }
  statement {
    sid       = "ReadHandoffParameters"
    actions   = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = ["arn:aws:ssm:${var.aws_region}:${var.aws_account_id}:parameter${local.ssm_prefix}/*"]
  }
  statement {
    sid       = "ReadMigrationSecret"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.supabase_migrations.arn]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "deploy"
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}

# ── State bucket read list ─────────────────────────────────────────
# The state file is a secrets store, so reading it is limited to this env's CI
# roles plus one named break-glass identity. The bucket itself is created out
# of band (bootstrap/create-state-bucket.sh); only its policy is managed here.

data "aws_iam_policy_document" "state_bucket" {
  statement {
    sid       = "DenyStateReadExceptNamedPrincipals"
    effect    = "Deny"
    actions   = ["s3:GetObject"]
    resources = ["${local.state_bucket_arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "ArnNotEquals"
      variable = "aws:PrincipalArn"
      values = [
        aws_iam_role.github_actions_plan.arn,
        aws_iam_role.github_actions_apply.arn,
        var.break_glass_principal_arn,
      ]
    }
  }
}

resource "aws_s3_bucket_policy" "state" {
  bucket = var.tf_state_bucket
  policy = data.aws_iam_policy_document.state_bucket.json
}
