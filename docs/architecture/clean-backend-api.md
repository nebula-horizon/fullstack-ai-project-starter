# 🏗️ Clean Backend API Architecture (AdonisJS v6)

This document details the Clean Architecture patterns, domain-driven design, and type-safe database adapters implemented inside the backend API application (`apps/api`).

---

## 1. Architectural Philosophy

Our backend is built around **Clean Architecture**, segregating the core business rules from infrastructural framework adapters. This keeps the application highly modular, extensible, and completely testable without relying on active database or server connections during unit testing.

```text
  ┌──────────────────────────────────────────────────────────┐
  │                 Infrastructure Layer                     │
  │     (HTTP Controllers, Routing, Kysely Adapters)         │
  └───────────────────────────┬──────────────────────────────┘
                              │
                              ▼
  ┌──────────────────────────────────────────────────────────┐
  │                    Domain Use Cases                      │
  │               (Pure Business Logic Flow)                 │
  └───────────────────────────┬──────────────────────────────┘
                              │
                              ▼
  ┌──────────────────────────────────────────────────────────┐
  │                       Domain Core                        │
  │          (Entities & Abstract Repositories)              │
  └──────────────────────────────────────────────────────────┘
```

---

## 2. Layer Definitions & Directory Mappings

Inside `apps/api/app/`, files are strictly partitioned:

### A. Domain Entities (`app/domain/entities/`)
Entities are pure, framework-agnostic TypeScript types representing our core models (e.g. `User`). They contain zero imports from database libraries or Adonis decorators.
```typescript
// app/domain/entities/user.ts
export interface User {
  id: string
  email: string
  fullName: string | null
}
```

### B. Domain Repositories (`app/domain/repositories/`)
Repository interfaces define the abstract contracts for data operations. These are pure interfaces that the business logic (Use Cases) consumes:
```typescript
// app/domain/repositories/user_repository.ts
import type { User } from '../entities/user.js'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  create(user: Omit<User, 'createdAt'>): Promise<User>
}
```

### C. Infrastructure Repositories (`app/infrastructure/repositories/`)
Concrete adapters that implement the Domain Repository interfaces. They handle the low-level details of querying the database.
- We **bypass standard AdonisJS Lucid ORM models** to avoid duplicate schema definitions.
- Instead, we use **Kysely** as our typed query builder, mapping queries directly against the database types generated natively by the Supabase CLI.

### D. Controllers & Entry Points (`app/controllers/`)
HTTP controllers act as the infrastructure-level request handlers. They validate incoming request payloads, invoke Use Cases or Repository implementations, and return standardized JSON responses (e.g. `app/controllers/users_controller.ts`).

---

## 3. Database Connection & Kysely Binding

The database adapter is instantiated inside `app/services/db.ts` utilizing the `pg` pool driver:
```typescript
import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import type { Database } from '@template/db' // Dynamic types from Supabase!

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
})
```
By mapping the connection pool to `@template/db`'s compiled definitions, **every database query is strictly type-checked at compile-time**. If you alter a table in SQL, TypeScript will instantly throw compilation errors on any query referencing stale columns.

---

## 4. Portability & Dependency Protection
- **No Hardcoded Binaries:** All CLI execution scripts (such as Japa test runners) utilize the global generic `node` and `pnpm` binaries instead of host-specific Homebrew absolute paths, guaranteeing 100% portability inside production Alpine containers.
- **Node.js 22+ standard:** The entire backend toolchain is standardized on Node 22 (using the native `fs/promises` glob API), aligned through both Docker and root-level Mise configurations.
