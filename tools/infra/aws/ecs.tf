# ECS Fargate services for apps/web and apps/api.
#
# Two owners, on purpose. OpenTofu owns how each service runs: CPU/memory,
# network, roles, log group, env var names and secret ARNs. The deploy
# workflows (.github/workflows/deploy-*.yml) own what runs: they register a new
# task-definition revision with the new image and roll the service. So the
# service ignores task_definition changes (an infra apply never rolls an app
# back), and old task definitions are kept (skip_destroy).
#
# The image below is a bootstrap placeholder: until the first app deploy pushes
# a real image, tasks fail to pull and the service retries. That is expected on
# a brand-new environment.
#
# An infra-only change to a task definition (e.g. CPU) takes effect on the next
# app deploy, which renders from the latest revision of the family.

resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "app" {
  for_each = local.apps

  name              = "/ecs/${local.name_prefix}-${each.key}"
  retention_in_days = var.log_retention_days
}

locals {
  container_environment = {
    web = {
      NODE_ENV = "production"
      PORT     = "3000"
      HOST     = "0.0.0.0"
    }
    api = {
      NODE_ENV  = "production"
      PORT      = "3333"
      HOST      = "0.0.0.0"
      TZ        = "UTC"
      LOG_LEVEL = "info"
      APP_URL   = "https://${var.app_domain}"
    }
  }

  # Only ARNs travel through IaC — never values. ECS resolves them at task
  # start; rotating a value then needs a service restart, not a code change.
  container_secrets = {
    # Web gets only browser-safe values, read at runtime — never the service-role key.
    web = {
      SUPABASE_ANON_KEY = "${aws_secretsmanager_secret.web_runtime.arn}:SUPABASE_ANON_KEY::"
      SUPABASE_URL      = aws_ssm_parameter.supabase["url"].arn
    }
    api = {
      APP_KEY                   = "${aws_secretsmanager_secret.api_runtime.arn}:APP_KEY::"
      DATABASE_URL              = "${aws_secretsmanager_secret.api_runtime.arn}:DATABASE_URL::"
      JWT_SECRET                = "${aws_secretsmanager_secret.api_runtime.arn}:JWT_SECRET::"
      SUPABASE_SERVICE_ROLE_KEY = "${aws_secretsmanager_secret.api_runtime.arn}:SUPABASE_SERVICE_ROLE_KEY::"
      SUPABASE_URL              = aws_ssm_parameter.supabase["url"].arn
    }
  }
}

resource "aws_ecs_task_definition" "app" {
  for_each = local.apps

  family                   = "${local.name_prefix}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_execution[each.key].arn
  task_role_arn            = aws_iam_role.ecs_task[each.key].arn

  container_definitions = jsonencode([{
    name      = each.key
    image     = "${aws_ecr_repository.app[each.key].repository_url}:bootstrap"
    essential = true

    portMappings = [{ containerPort = each.value.port, protocol = "tcp" }]

    environment = [for k, v in local.container_environment[each.key] : { name = k, value = v }]
    secrets     = [for k, v in local.container_secrets[each.key] : { name = k, valueFrom = v }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app[each.key].name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = each.key
      }
    }
  }])

  # Never deregister a revision a running service may depend on.
  skip_destroy = true
}

resource "aws_ecs_service" "app" {
  for_each = local.apps

  name            = "${local.name_prefix}-${each.key}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app[each.key].arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app[each.key].id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app[each.key].arn
    container_name   = each.key
    container_port   = each.value.port
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.https]

  lifecycle {
    # Revisions are chosen by the deploy workflows, not by OpenTofu.
    ignore_changes = [task_definition]
  }
}
