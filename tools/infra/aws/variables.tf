# All inputs, with validation blocks.
# Values come from environments/<env>.tfvars. Placeholders such as "<product>"
# fail validation on purpose, so a forgotten placeholder stops the plan early.

variable "product" {
  description = "Short product slug used in every resource name and SSM path."
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.product))
    error_message = "product must be a lowercase slug (replace the <product> placeholder)."
  }
}

variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be one of: dev, prod."
  }
}

variable "aws_region" {
  type = string
  validation {
    condition     = can(regex("^[a-z]{2}(-[a-z]+)+-[0-9]$", var.aws_region))
    error_message = "aws_region must be an AWS region name (replace the <region> placeholder)."
  }
}

variable "aws_account_id" {
  description = "The AWS account this environment owns. Not a secret."
  type        = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be 12 digits (replace the <account-id> placeholder)."
  }
}

variable "github_repository" {
  description = "<org>/<repo> — the only repository whose workflows may assume the CI roles."
  type        = string
  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "github_repository must be <org>/<repo> (replace the placeholder)."
  }
}

variable "tf_state_bucket" {
  description = "State bucket created out of band. Used to scope read access to it."
  type        = string
}

variable "break_glass_principal_arn" {
  description = "The one named break-glass identity allowed to read state and secrets besides CI."
  type        = string
  validation {
    condition     = can(regex("^arn:aws:iam::[0-9]{12}:(role|user)/.+$", var.break_glass_principal_arn))
    error_message = "break_glass_principal_arn must be an IAM role or user ARN (replace the placeholder)."
  }
}

# ── Network ──────────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  type = string
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid CIDR block."
  }
}

variable "availability_zone_count" {
  type = number
  validation {
    condition     = var.availability_zone_count >= 2 && var.availability_zone_count <= 3
    error_message = "availability_zone_count must be 2 or 3."
  }
}

variable "single_nat_gateway" {
  description = "One shared NAT gateway (cheap, dev) instead of one per AZ (available, prod)."
  type        = bool
}

# ── Edge ─────────────────────────────────────────────────────────────────────

variable "app_domain" {
  description = "Public hostname the ALB serves, e.g. dev.example.com. DNS is managed outside this module."
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate for app_domain, issued out of band in this account and region."
  type        = string
  validation {
    condition     = can(regex("^arn:aws:acm:", var.certificate_arn))
    error_message = "certificate_arn must be an ACM certificate ARN (replace the placeholder)."
  }
}

# ── Compute ──────────────────────────────────────────────────────────────────

variable "ecs_desired_count" {
  type = number
  validation {
    condition     = var.ecs_desired_count >= 1
    error_message = "ecs_desired_count must be at least 1."
  }
}

variable "ecs_task_cpu" {
  type = number
}

variable "ecs_task_memory" {
  type = number
}

# ── Retention and protection ─────────────────────────────────────────────────

variable "log_retention_days" {
  type = number
}

variable "enable_deletion_protection" {
  type = bool
}
