# Build-App Journey

You are the coding agent for this fullstack template. The user just launched you
from `scripts/bootstrap` to **build their app**. Follow this playbook end-to-end.

This file is agent-agnostic — it works whether you are Claude Code, opencode, or
Cursor. The project's conventions live in `AGENTS.md` (already loaded for you);
this playbook only adds *sequence and intent*. Re-read `AGENTS.md` before writing
any code and obey it strictly (Biome style, Clean Architecture layering, Kysely
not Lucid, path aliases, the contracts regen loop).

The project has already been personalized (renamed from `@template` to the user's
scope) before you were launched. Do **not** run `scripts/bootstrap` again.

---

## Mode: full-auto

Build the app without stopping for human approval. Safety is internal, not a gate:
clarify briefly, echo a plan, build a bounded slice, then verify it actually boots.

---

## Phase 1 — Greet and clarify (keep it short)

1. Greet the user by their project name (it was passed to you in the launch prompt).
2. Ask: **"What do you want to build?"**
3. Then clarify with **at most 3–5 high-leverage questions** — only the ones that
   materially change what you build. Good targets:
   - The single core feature / primary entity for the first slice
   - Key fields on that entity
   - Whether it needs to be tied to the authenticated user
   - Any must-have UI interaction
4. **Never ask what the codebase can answer.** Auth, styling, data access, project
   layout, and conventions are already decided — read the repo, don't ask.
5. Infer everything else from sensible defaults. Do not interrogate. When you have
   enough to define ONE vertical slice, stop asking.

---

## Phase 2 — Echo the plan (non-blocking, ~5 lines)

Print a short numbered plan of the vertical slice you're about to build, e.g.:

```
Plan for <project>:
  1. Migration: <table> (<fields>)
  2. Domain entity + repository interface
  3. Kysely repository implementation
  4. Validator + controller + route (with JSDoc)
  5. Regenerate contracts
  6. Web route consuming it via $api
```

Do **not** wait for approval. This is a glance, not a gate — proceed immediately.

---

## Phase 3 — Capture the spec (use the pre-wired OpenSpec workflow)

This template ships the OpenSpec workflow wired into all three agents
(`/opsx:propose`, `/opsx:apply`). Use it so the build is spec-driven and leaves
the user a clean artifact trail under `openspec/changes/`.

1. Run **`/opsx:propose "<the user's app idea, in one clear sentence>"`** to
   generate the proposal, design, specs, and tasks for their feature.
2. **Full-auto override:** OpenSpec normally pauses for human review between
   propose and apply. Skip that pause. Proceed straight to
   **`/opsx:apply <change-name>`** without waiting for approval.

**Fallback if OpenSpec is unavailable** (the `openspec` binary is missing, or the
commands error): do not crash. Write a short plain plan to `PLAN.md` at the repo
root and proceed to Phase 4 directly. The build matters more than the ceremony.

---

## Phase 4 — Build the vertical slice (learn from the reference slice)

**Bounded scope:** build the *smallest end-to-end vertical slice* — one feature,
DB → API → UI — as a proof of concept. NOT the whole product.

**Do NOT** in this first slice: add extra entities beyond the core one, build admin
panels, add background jobs/queues, write exhaustive tests, add third-party
integrations, or gold-plate the UI. One feature, working, end to end.

**Learn the conventions by example.** This repo already contains a complete,
working `User` slice. Study it and replicate its shape for the user's domain:

| Layer            | Reference file to copy the pattern from                          |
|------------------|------------------------------------------------------------------|
| Migration (DDL)  | `tools/supabase/migrations/00000000000000_init.sql`              |
| Domain entity    | `apps/api/app/domain/entities/user.ts`                           |
| Repo interface   | `apps/api/app/domain/repositories/user_repository.ts`            |
| Kysely repo impl | `apps/api/app/infrastructure/repositories/KyselyUserRepository.ts`|
| Validator        | `apps/api/app/validators/user.ts`                                |
| Controller       | `apps/api/app/controllers/users_controller.ts`                   |
| Web route        | `apps/web/src/routes/` (and `apps/web/src/utils/api.ts` for `$api`)|

**Golden-path sequence** (follow in order — each step feeds the next):

1. **Migration** — write raw DDL in `tools/supabase/migrations/<timestamp>_<name>.sql`.
   Apply it: `mise run db:reset` (or the project's Supabase task).
2. **Regenerate DB types** — `mise run db:types` (or in `packages/db`: `pnpm run gen-types`).
   This updates `packages/db/src/types.ts` — the source of truth for Kysely.
3. **Domain** — add the pure-TS entity and repository interface under
   `apps/api/app/domain/`. Zero framework imports (no AdonisJS, no HTTP).
4. **Infrastructure** — implement the repository with Kysely, bound to the
   generated DB types, under `apps/api/app/infrastructure/repositories/`.
5. **HTTP** — add the validator, then the controller (annotate endpoints with
   JSDoc for OpenAPI), then register the route.
6. **Contracts** — from `apps/api`: `node --import tsx ace.js docs:generate` to
   export `packages/contracts/openapi.yaml`, then build the contracts workspace
   (`pnpm --filter <project-scope>/contracts run build`).
7. **Web** — add a TanStack route under `apps/web/src/routes/` that consumes the
   new endpoint via the typed `$api` client from `@/utils/api`. Never hand-write
   fetch clients or React Query hooks.

---

## Phase 5 — Self-verify (this is what makes "done" mean done)

"Done" is not "I stopped typing." It is "I confirmed it builds and boots."
Run these and **fix-and-re-verify on any failure** before declaring completion:

1. **Typecheck** — `mise run typecheck` (must pass with zero errors).
2. **Format/lint** — `mise run format` (Biome; must be clean).
3. **Boot** — start the app with `mise run dev` and confirm both the API and web
   server come up without crashing. Then stop it.

If a step fails, diagnose, fix, and run that step again. Do not report success
with a red check anywhere.

---

## Phase 6 — Hand back to the user

When the slice boots clean, tell the user:
- What you built (the one feature, end to end).
- How to run it: `mise run dev`.
- Where the spec artifact lives (`openspec/changes/<name>/`) if you used OpenSpec.
- One or two natural next slices they could ask for.

Then stop. Boom — a working PoC.
