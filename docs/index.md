# 📂 Documentation Index

Documentation for **this product**: design, data, releases, operations, security and day-to-day
recipes. Every folder below exists from day one, even when it holds only its index, so there is always an obvious place for the next page.

**The product:** a TypeScript monorepo with a TanStack Start web app (`apps/web`) and an AdonisJS
API (`apps/api`), using Supabase for Postgres and auth and AWS (ECS Fargate) for hosting. There are
two environments, `dev` and `prod`, in separate AWS and Supabase accounts.

| Folder | Answers | Start at |
| --- | --- | --- |
| [architecture/](./architecture/index.md) | Why is it built this way? | [overview.md](./architecture/overview.md) |
| [database/](./database/index.md) | Where is the data, and who owns it? | [overview.md](./database/overview.md) |
| [deployment/](./deployment/index.md) | How does a change ship? | [aws.md](./deployment/aws.md) |
| [runbooks/](./runbooks/index.md) | Something is wrong in production — what now? | [index.md](./runbooks/index.md) |
| [security/](./security/index.md) | Who can access what, and where are secrets stored? | [secrets-inventory.md](./security/secrets-inventory.md) |
| [workflows/](./workflows/index.md) | How do I do X while developing? | [local-setup.md](./workflows/local-setup.md) |

> **🔒 Nobody has standing production access.** Contact the admin for a temporary grant. Never give
> an AI agent production credentials. See [security/production-access.md](./security/production-access.md).

## Rules for this folder

- **Each folder keeps an `index.md`** that lists its pages.
- **Docs ship with the change:** if a PR changes something documented here, it updates the page too.
- **Current state, not history.** Pages describe how the system *is*, with the reason beside each
  rule. Diagrams are Mermaid.
- **Decisions live with what they decide**: in the relevant page and in OpenSpec specs under
  [`openspec/specs/`](../openspec/specs/), not in a separate `docs/decisions/` folder or ADRs.
  A decision log makes readers replay history; a page states what is true now, and why.
