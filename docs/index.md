# 📂 Documentation Index

Welcome to the centralized documentation repository. This directory serves as the single source of truth for all architectural specs, local developer guides, data schema contracts, and API structures.

---

## 🗺️ Documentation Directory Map

Manage, navigate, and keep these documents updated as your project scales:

- **📁 [/docs/architecture/](./architecture/)**: Permanent architectural spec sheets:
  - **[clean-backend-api.md](./architecture/clean-backend-api.md)**: AdonisJS v6 Domain-driven entities, repository interfaces, and Kysely database adapters.
  - **[web-frontend-gateway.md](./architecture/web-frontend-gateway.md)**: TanStack Start client-held JWT auth flow (Supabase sign-in, Bearer token attachment, dev API proxy).
- **📁 [/docs/workflows/](./workflows/)**: Local developer guides and workflows:
  - **[database-migrations.md](./workflows/database-migrations.md)**: Supabase local database ports, DDL migrations, and dynamic types generation.
  - **[type-safe-contracts.md](./workflows/type-safe-contracts.md)**: Swagger auto-export, contracts compilation, and type-safe react-query client fetching.

---

## 🏗️ Folder Documentation Rules
Every sub-directory created inside this project **MUST** follow our strict documentation maintenance standards (as declared in `AGENTS.md` and root guidelines):

1. **Mandatory Index File:** Every folder within `/docs` (or nested document sub-directories) MUST contain an `index.md` file outlining the folder's purpose and linking to all documents it holds.
2. **Continuous Updates:** Whenever architectural decisions, backend routes, local ports, or data models are added or modified, update the matching markdown documentation immediately.
3. **No Code Redundancy:** Keep documentation clean, clear, and high-level—do not paste raw code files unless they serve as necessary configuration examples.
