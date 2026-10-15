# 🚫 Production Access

## The rule

- **Nobody holds standing production access.** No one keeps credentials for the prod AWS account, the
  prod Supabase account, production secret values, or production data. Production changes only
  through the CI release path, after a required reviewer approves
  ([deployment/aws.md](../deployment/aws.md)). Approving that deployment does not give the approver
  any credential.
- **Need access? Contact the admin.** Access is granted manually and temporarily. Say which system
  you need (read or write), why CI cannot do it, and for how long. The admin removes the access when
  the time or the task ends. While you have it, use it only for that task, and don't create keys,
  users, tokens or jobs that would outlast it. If you saw a production secret value, tell the admin
  so it can be rotated.
- **AI agents never get production credentials.** No prod key, connection string or token goes into
  an agent's prompt, files, environment or tool configuration. Don't run an agent in a shell
  that currently holds a production grant: the agent can use whatever the shell can reach. Agents
  change production the same way people do, through a pull request.

Why: production then always matches `main`, a credential nobody keeps cannot leak from a laptop or an
agent session, and every grant is rare enough to be noticed and reviewed.

## Dev is different

Everyone on the team has dev access. Dev and prod are separate AWS accounts and separate Supabase
accounts, so dev access never leads to production. Never put a production value in a dev or local
setup.
