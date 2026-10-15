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

pnpm install
(cd apps/api && node --import tsx ace.js generate:key)   # per-machine APP_KEY into apps/api/.env

mise run db:start                              # local Supabase: Postgres, Auth, Studio
mise run db:status                             # prints the local URL and anon key
```

Put the local anon key from `db:status` into `apps/web/.env` as `SUPABASE_ANON_KEY`. The web server
reads it at runtime and hands it to the browser; it is never compiled into the bundle. Never put the
service-role key in `apps/web` ([security/secrets-inventory.md](../security/secrets-inventory.md)).

```bash
mise run db:reset    # apply every migration to the local DB
mise run dev         # web on http://localhost:3000, api on http://localhost:3333
```

Local ports: Postgres `127.0.0.1:54332`, Supabase API `http://127.0.0.1:54326`, Studio
`http://127.0.0.1:54328`, Mailpit `http://127.0.0.1:54324`.

## 3. Notes

- Personal editor files (`.vscode/`, `.idea/`) belong in your **global** gitignore, not the repo's.
- **Agent skills and commands** are committed for each tool: `.claude/` (Claude Code), `.cursor/`
  and `.opencode/`. They work straight from a fresh clone; see [generated-files.md](./generated-files.md).
- **Upgrading an older clone:** `.claude` used to be a symlink to `.agents/`. Before pulling, remove
  the link (`rm .claude`, or `rmdir .claude` on Windows) so git can create the real directory.
