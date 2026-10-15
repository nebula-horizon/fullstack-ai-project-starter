# 💻 Local Setup

From a fresh clone to both apps running against the local Supabase stack. Local development uses
**dev values only** and never a hosted Supabase account.

## 1. Prerequisites

- **Docker**, installed and running: the local Supabase stack runs in containers.
- **[mise](https://mise.jdx.dev/getting-started.html)**: installs the pinned Node, pnpm, Biome,
  Supabase CLI and OpenTofu from `mise.toml`.
- **A coding agent** such as Claude Code. It reads `AGENTS.md` (via `CLAUDE.md`).

## 2. Steps

```bash
mise trust && mise install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

pnpm install                                   # also links .claude/{skills,commands} → .agents
(cd apps/api && node --import tsx ace.js generate:key)   # per-machine APP_KEY into apps/api/.env

mise run db:start                              # local Supabase: Postgres, Auth, Studio
mise run db:status                             # prints the local URL and anon key
```

Put the local anon key from `db:status` into `apps/web/.env` as `VITE_SUPABASE_ANON_KEY`. Never put
the service-role key in `apps/web` ([security/secrets-inventory.md](../security/secrets-inventory.md)).

```bash
mise run db:reset    # apply every migration to the local DB
mise run dev         # web on http://localhost:3000, api on http://localhost:3333
```

Local ports: Postgres `127.0.0.1:54332`, Supabase API `http://127.0.0.1:54326`, Studio
`http://127.0.0.1:54328`, Mailpit `http://127.0.0.1:54324`.

## 3. Notes

- Personal editor files (`.vscode/`, `.idea/`) belong in your **global** gitignore, not the repo's.
- **Upgrading an older clone:** `.claude` used to be a symlink to `.agents`. Before pulling, run
  `rm .claude` (on Windows, `rmdir .claude`), then `pnpm install` to recreate the links inside a real
  `.claude/` directory.
