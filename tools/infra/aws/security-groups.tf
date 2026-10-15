# The ALB is the only thing open to the internet. Each app accepts traffic on
# its own port from the ALB and from nowhere else.

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb"
  description = "Public HTTPS entry point"
  vpc_id      = aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  # Only ever answers with a redirect to HTTPS (alb.tf).
  security_group_id = aws_security_group.alb.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_egress_rule" "alb_to_apps" {
  for_each = local.apps

  security_group_id            = aws_security_group.alb.id
  referenced_security_group_id = aws_security_group.app[each.key].id
  ip_protocol                  = "tcp"
  from_port                    = each.value.port
  to_port                      = each.value.port
}

resource "aws_security_group" "app" {
  for_each = local.apps

  name        = "${local.name_prefix}-${each.key}"
  description = "${each.key} ECS tasks"
  vpc_id      = aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  for_each = local.apps

  security_group_id            = aws_security_group.app[each.key].id
  referenced_security_group_id = aws_security_group.alb.id
  ip_protocol                  = "tcp"
  from_port                    = each.value.port
  to_port                      = each.value.port
}

resource "aws_vpc_security_group_egress_rule" "app_outbound" {
  # Outbound to Supabase cloud, ECR, Secrets Manager, SSM and CloudWatch via NAT.
  for_each = local.apps

  security_group_id = aws_security_group.app[each.key].id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
