# aws-deployment Specification

## Purpose
How apps/web and apps/api reach AWS.
Human-readable detail lives in `docs/deployment/aws.md` and `docs/security/`.

## Requirements

### Requirement: Two environments in separate AWS accounts
The system SHALL deploy to exactly two environments, `dev` and `prod`, each in its own AWS account, each with its own state bucket and state key, its own `tools/infra/aws/environments/<env>.tfvars`, and a `<product>-<env>-` resource-name prefix.

#### Scenario: Wrong account is refused
- **WHEN** OpenTofu runs with `environments/dev.tfvars` against credentials for any account other than `aws_account_id`
- **THEN** the AWS provider SHALL refuse to run (`allowed_account_ids`)

### Requirement: Branch to environment mapping
The system SHALL deploy the `dev` branch to the dev environment automatically on push, and the `main` branch to the prod environment only after a required reviewer approves the `prod` GitHub Environment.

#### Scenario: Merge to dev
- **WHEN** a change under a deploy path is pushed to `dev`
- **THEN** the matching workflow SHALL apply or deploy to dev without approval

#### Scenario: Merge to main
- **WHEN** a change under a deploy path is pushed to `main`
- **THEN** the apply or deploy job SHALL declare the `prod` Environment and wait for a required reviewer

### Requirement: Infrastructure is planned before it is applied
The infrastructure workflow SHALL run `tofu plan -out=tfplan` on every pull request into `dev` or `main`, post the plan on the pull request, fail if a protected stateful resource would be replaced or deleted, and on push apply exactly the saved plan artifact.

#### Scenario: Plan would replace a protected resource
- **WHEN** the plan contains a `delete` or `delete,create` action on a protected type (e.g. `aws_secretsmanager_secret`, `aws_vpc`, `aws_s3_bucket`)
- **THEN** `.ci/scripts/check-protected-resources.sh` SHALL fail the plan job

### Requirement: CI authenticates with OIDC only
GitHub Actions SHALL obtain AWS credentials only through OIDC federation; no AWS access key SHALL be stored in GitHub. Each account SHALL have a read-only plan role trusted for `environment:<env>-plan`, and apply and deploy roles trusted for `environment:<env>`.

#### Scenario: A plan job targets prod
- **WHEN** a pull request into `main` runs the plan job
- **THEN** the job SHALL declare the protection-free `prod-plan` Environment and assume the read-only plan role

### Requirement: Infrastructure and application deploys are separate workflows
Infrastructure changes (`tools/infra/**`) SHALL run only `infrastructure.yml`. Each app SHALL have its own path-filtered deploy workflow whose filter includes `apps/<app>/**`, `packages/**`, and the workflow file itself.

#### Scenario: Shared package changes
- **WHEN** a change touches only `packages/**` and is pushed to `dev`
- **THEN** both `deploy-api` and `deploy-web` SHALL run, and `infrastructure` SHALL NOT

### Requirement: Split ownership of ECS services
OpenTofu SHALL own the ECS service shell (size, network, roles, env var names, secret ARNs); the deploy workflows SHALL own the image and task-definition revision. The ECS service SHALL ignore changes to `task_definition`.

#### Scenario: Unrelated infra change after a deploy
- **WHEN** an infrastructure apply runs after an app deploy
- **THEN** it SHALL NOT roll the service back to an older image

### Requirement: Secrets live in Secrets Manager, values set out of band
Runtime and migration secrets SHALL live in AWS Secrets Manager. OpenTofu SHALL create only the secret containers, never a secret version, so no value enters git, a plan, GitHub, or the state file. Applications SHALL receive secret ARNs, resolved by ECS at task start.

#### Scenario: New environment bootstrapped
- **WHEN** an environment is applied for the first time
- **THEN** the API tasks SHALL NOT start until an admin writes the secret values out of band

### Requirement: No standing production access
No person and no AI agent SHALL hold standing credentials for the prod AWS account or the prod Supabase account. Temporary access SHALL be granted manually by an admin on request.

#### Scenario: An engineer needs to inspect prod
- **WHEN** an engineer needs prod access
- **THEN** they SHALL contact the admin, who grants temporary access manually and revokes it afterwards
