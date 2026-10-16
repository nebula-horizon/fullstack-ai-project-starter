# 📁 Security

How users are authenticated, which secrets exist and where, and who may touch production.

## Documents Index
- **[secrets-inventory.md](./secrets-inventory.md)**: Every secret by name: where it is stored per environment, what it opens, who owns it. Never a value.
- **[production-access.md](./production-access.md)**: No standing production access; temporary grants from the admin; AI agents never get production credentials.
- Auth model: users sign in with Supabase Auth; the API accepts only a JWT verified against the project's JWT secret. See **[architecture/web-frontend-gateway.md](../architecture/web-frontend-gateway.md)** and `apps/api/app/middleware/jwt_auth_middleware.ts`. Row-level security on `public.profiles` is described in **[database/overview.md](../database/overview.md)**.
