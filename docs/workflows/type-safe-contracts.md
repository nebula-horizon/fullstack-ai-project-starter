# 🔌 Type-Safe Contracts & Code-Gen Workflow

This document outlines the OpenAPI contract synchronization loop, Swagger auto-export, and zero-boilerplate TanStack Query client compilation pipeline.

---

## 1. Overview & Single Source of Truth

We use a **Code-First contract pipeline**. 
1. Our routes, request controllers, and Joi/VineJS validators inside `apps/api` serve as the single source of truth.
2. We auto-export this routing metadata into an `openapi.yaml` specification file.
3. We compile the YAML into static TypeScript path types (`api.d.ts`) inside `packages/contracts/`.
4. Our frontend (`apps/web`) imports these types and feeds them to `openapi-react-query` to provide 100% autocomplete query hooks.

This entirely eliminates the need to write manual API fetch functions, SDK wrappers, or endpoint interfaces.

---

## 2. Step-by-Step Contract Synchronization Loop

Whenever you add, delete, or modify a backend API endpoint, follow this three-step workflow to synchronize the entire monorepo:

### Step 1: Annotate Adonis Controllers (JSDoc)
To let the Swagger compiler (`@rnwonder/adonis-autoswagger`) dynamically discover and map your route payloads, you must annotate your controller methods with clean JSDoc comments:

```typescript
// apps/api/app/controllers/users_controller.ts

/**
 * @me
 * @operationId me
 * @responseBody 200 - { "id": "string", "email": "string", "fullName": "string" }
 */
async me({ response, user }: HttpContext) {
  // ...
}
```
*Note: If you omit these annotations, the compiler will skip generating path operations for the routes.*

### Step 2: Generate the OpenAPI Spec
Run the custom asynchronous Swagger exporter inside the AdonisJS backend directory:
```bash
# From the root workspace, run the global Mise task:
mise run api:generate-openapi
```
This writes the fully-populated specification directly to `packages/contracts/openapi.yaml`.

### Step 3: Compile the Contracts Package
Compile the YAML file into type-safe path interfaces and rebuild the contracts package:
```bash
# Inside packages/contracts/
pnpm run compile-contracts && pnpm run build
```
This runs `openapi-typescript` to output `packages/contracts/src/api.d.ts` and builds the package using `tsup` into optimized ESM bundles.

---

## 3. Consuming in the Frontend

Your frontend `$api` client is now completely updated. TypeScript will instantly compile, autocompleting your new path name and validating payload parameter shapes:

```tsx
import { $api } from '@/utils/api' // Unified @/* path alias!

export default function Profile() {
  // Autocompleted endpoints, checked types, zero boilerplate!
  const { data: user } = $api.useQuery('get', '/api/v1/users/me')
  
  return <div>{user?.fullName}</div>
}
```

---

## 4. Key Architectural Safeguards

- **Path Prefix Sync:** All REST API routes inside the backend (`apps/api/start/routes.ts`) are grouped under the `/api/v1` prefix. Ensure your frontend query paths (e.g. `/api/v1/users/me`) incorporate this prefix exactly to prevent path mismatch errors.
- **Static Type-Checking:** Vite utilizes `esbuild` for fast transpilation and does *not* run type-checks on build. To perform a strict, static TypeScript check across both applications before committing code, always run:
  ```bash
  mise run typecheck
  ```
  This executes `tsc --noEmit` on both `apps/web` and `apps/api` in parallel, catching any contract mismatches instantly.
