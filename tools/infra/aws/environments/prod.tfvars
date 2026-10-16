# prod — inputs for the prod account.
# Non-secret, structural values only. Replace every <placeholder>; validation
# in variables.tf refuses to plan while one is left.

product        = "<product>"
environment    = "prod"
aws_region     = "<region>"
aws_account_id = "<account-id-prod>"

github_repository         = "<org>/<repo>"
tf_state_bucket           = "<state-bucket-prod>"
break_glass_principal_arn = "<break-glass-role-arn-prod>"

# Network. Three AZs, so one AZ outage leaves two serving.
vpc_cidr                = "10.1.0.0/16"
availability_zone_count = 3
single_nat_gateway      = false

# Edge. DNS and the ACM certificate are created out of band (not covered by the guide).
app_domain      = "<prod-domain>"
certificate_arn = "<acm-certificate-arn-prod>"

# Compute. At least two tasks per service, sized for real traffic.
ecs_desired_count = 2
ecs_task_cpu      = 1024
ecs_task_memory   = 2048

# Retention and protection. Longer logs; deletion protection on.
log_retention_days         = 90
enable_deletion_protection = true
