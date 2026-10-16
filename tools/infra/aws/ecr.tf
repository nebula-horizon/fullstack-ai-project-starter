# One image repository per app. Tags are immutable: every deploy pushes the
# commit SHA, so "what is running" is always a commit you can check out.

resource "aws_ecr_repository" "app" {
  for_each = local.apps

  name                 = "${local.name_prefix}-${each.key}"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  for_each = local.apps

  repository = aws_ecr_repository.app[each.key].name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the most recent images only"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = var.environment == "prod" ? 50 : 20
      }
      action = { type = "expire" }
    }]
  })
}
