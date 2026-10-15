# dev — inputs for the dev account.
# Non-secret, structural values only. Replace every <placeholder>; validation
# in variables.tf refuses to plan while one is left.

product        = "<product>"
environment    = "dev"
aws_region     = "<region>"
aws_account_id = "<account-id-dev>"

github_repository         = "<org>/<repo>"
tf_state_bucket           = "<state-bucket-dev>"
break_glass_principal_arn = "<break-glass-role-arn-dev>"

# Network. Two AZs: still multi-AZ, at lower cost than prod.
vpc_cidr                = "10.0.0.0/16"
availability_zone_count = 2
single_nat_gateway      = true

# Edge. DNS and the ACM certificate are created out of band (not covered by the guide).
app_domain      = "<dev-domain>"
certificate_arn = "<acm-certificate-arn-dev>"

# Compute. Smallest useful size; dev is for verification, not load.
ecs_desired_count = 1
ecs_task_cpu      = 256
ecs_task_memory   = 512

# Retention and protection. Short logs, no deletion protection, so dev can be rebuilt.
log_retention_days         = 14
enable_deletion_protection = false
