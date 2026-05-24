# 🔑 Web Frontend & Auth Architecture (TanStack Start)

This document details the client-held JWT strategy, type-safe data fetching, and dev-time API routing implemented inside the web application (`apps/web`).

---

## 1. Architectural Philosophy

The frontend uses **TanStack Start** (the modern, Vite-driven React framework). Authentication is delegated to **Supabase Auth**, and the browser holds the resulting access token (a JWT) directly.

This is a **client-held bearer token** model, not an HttpOnly server session. The browser reads the token to attach it to outgoing API requests, and the AdonisJS backend statelessly verifies the JWT signature on every call.

```text
  ┌──────────────────────────────────────────────────────────┐
  │                    Browser Client                         │
  │   - React Components (CSR)                                │
  │   - supabase-js: signInWithPassword() → access_token      │
  │   - Token stored in a js-cookie cookie                    │
  │   - $api.useQuery() targeting relative "/api/*"           │
  │   - openapi-fetch middleware attaches Bearer <JWT>        │
  └───────────────────────────┬──────────────────────────────┘
                              │  Authorization: Bearer <JWT>
                              ▼  (dev: Vite proxy → :3333)
  ┌──────────────────────────────────────────────────────────┐
  │                 AdonisJS Backend Container                │
  │   - Headless REST API                                     │
  │   - jwt_auth_middleware verifies JWT via jose +           │
  │     JWT_SECRET (== Supabase JWT signing secret)           │
  └──────────────────────────────────────────────────────────┘
```

---

## 2. The Client-Held JWT Flow

### A. Obtaining the token
`apps/web/src/utils/supabase.ts` exposes a browser Supabase client (`persistSession`, `autoRefreshToken`). On the login page, `supabase.auth.signInWithPassword({ email, password })` returns a session whose `access_token` is a JWT signed with the Supabase project's JWT secret.

### B. Storing & refreshing the token
The token is stored in a client-readable cookie via `js-cookie` (`apps/web/src/utils/auth.ts`). To keep the cookie current, `supabase.ts` subscribes to `onAuthStateChange` and mirrors the live access token into the cookie on every sign-in and silent refresh, clearing it on sign-out.

> ⚠️ Because the cookie is **not** HttpOnly, the token is readable by client-side scripts. This is an intentional trade-off for the zero-boilerplate typed client. If your threat model requires XSS-resistant tokens, move to an HttpOnly server-proxy pattern and inject the header server-side instead.

### C. Attaching the token
`apps/web/src/utils/api.ts` instantiates the typed `openapi-fetch` client with `baseUrl: '/'` and registers an `onRequest` middleware that reads the cookie and appends `Authorization: Bearer <JWT>`. The middleware is guarded with `typeof document === 'undefined'` so it is skipped during SSR.

### D. Verifying the token
`apps/api/app/middleware/jwt_auth_middleware.ts` verifies the JWT with `jose.jwtVerify` against `JWT_SECRET`. That secret **must equal the Supabase JWT signing secret** — locally this is the Supabase CLI default; in production set it to your project's JWT secret.

---

## 3. Dev-Time API Routing

All `$api` calls target relative paths like `/api/v1/users/me`. In development the Vite dev server proxies them to the backend:

- `apps/web/vite.config.ts` defines `server.proxy` for `/api` and `/health`, targeting `http://localhost:3333` (overridable via the `API_URL` env var).
- Prefixes match on both sides, so no path rewriting is needed.

In production, deploy the web app behind a reverse proxy (or gateway) that routes `/api/*` to the AdonisJS service, preserving the same relative-path contract.

---

## 4. Profile Provisioning

Supabase auth users live in `auth.users`; the application's profile data lives in `public.profiles`. A database trigger (`on_auth_user_created` → `handle_new_user`, see `tools/supabase/migrations/`) inserts a matching `profiles` row on signup, so a freshly authenticated user always resolves through `GET /api/v1/users/me`.

---

## 5. Production Hardening
Both the client and SSR build pipelines compile into standard, optimized chunks under **Vite v6**, preventing ephemeral configuration cache files (`app.config.timestamp*`) from cluttering the repository.
