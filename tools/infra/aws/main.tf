# Everything this product runs in AWS. A single root module, split into one
# file per AWS area. The same files serve dev and
# prod; the differences live in environments/<env>.tfvars.

terraform {
  # use_lockfile below (S3-native state locking) first shipped in OpenTofu 1.10.
  required_version = "~> 1.10"

  required_providers {
    aws = {
      # The hashicorp/aws address works in both OpenTofu's and Terraform's registries.
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    # Bucket, key and region are passed by CI with -backend-config per environment.
    encrypt = true

    # Lock state with an S3 object; no DynamoDB table needed.
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region

  # Belt and braces on top of separate accounts: refuse to run against an
  # account this environment does not own.
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Product     = var.product
      Environment = var.environment
      ManagedBy   = "OpenTofu"
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # Drives every resource name: <product>-<env>-….
  name_prefix = "${var.product}-${var.environment}"

  # SSM parameter namespace: /<product>/<env>/<area>/<key>
  ssm_prefix = "/${var.product}/${var.environment}"

  azs = slice(data.aws_availability_zones.available.names, 0, var.availability_zone_count)

  apps = {
    web = { port = 3000, health_path = "/" }
    api = { port = 3333, health_path = "/health" }
  }
}
