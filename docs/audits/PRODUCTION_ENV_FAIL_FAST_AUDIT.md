# Production environment fail-fast audit

## Status

Security/runtime audit and decision record for environment-variable behavior.

Related issue: #296

## Context

FamilyFinance is now treated as a SaaS-first, multi-tenant financial product. In that context, missing runtime configuration should not be silently accepted in production.

The current codebase has two different levels of environment validation:

- CI fails early when required Supabase/Admin variables are missing.
- Runtime proxy behavior still skips session checks when public Supabase environment variables are missing.

This audit records the current state and the recommended follow-up before changing runtime behavior.

## Current state

### CI

`.github/workflows/ci.yml` validates required environment before install/build/test:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`

This is correct for CI.

### Shared env helper

`lib/utils.ts` exposes:

```ts
export const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasEnvVars = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && supabasePublicKey,
);
```

This helper only checks the public Supabase browser/server-session variables. It does not check private server variables such as `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_EMAIL`.

### Server Supabase client

`lib/supabase/server.ts` throws when `NEXT_PUBLIC_SUPABASE_URL` or the public Supabase key is missing.

This means server-side code that explicitly creates the server client already fails strongly.

### Admin Supabase client

`lib/supabase/admin.ts` throws when `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing.

This means admin/server-role paths already fail strongly.

### Proxy/session refresh

`lib/supabase/proxy.ts` currently returns `NextResponse.next()` when `hasEnvVars` is false or when public Supabase URL/key are missing.

That behavior is useful for starter/template development, but is risky for a production SaaS because it can mask a misconfigured deployment and skip session enforcement in the proxy layer.

## Risk

Silent runtime continuation in protected paths can create confusing or unsafe behavior:

- misconfigured production deploys may appear alive instead of failing clearly;
- auth/session refresh can be skipped without a clear operator signal;
- downstream server components may throw later, creating inconsistent UX;
- the project can drift back toward template behavior instead of SaaS production posture.

This does not automatically mean private financial data is exposed, because server-side pages/actions still create Supabase clients and/or require organization/profile access. However, it is still a production-readiness gap.

## Decision

The desired policy is:

```txt
CI: fail fast.
Production runtime: fail fast for protected/session-managed paths.
Local development: may show warning or allow graceful degradation.
Preview/staging: should fail fast unless explicitly configured for demo mode.
```

The next implementation should not rely only on `hasEnvVars`. It should introduce an explicit runtime policy helper that distinguishes development from production-like environments.

Recommended helper shape:

```ts
function shouldFailFastForMissingRuntimeEnv() {
  return process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
}
```

Then `updateSession` can keep local/template friendliness while refusing to silently skip auth/session handling in production-like runtime.

## Recommended follow-up PR

Create a small functional PR:

```txt
Fail fast on missing Supabase public env in production proxy
```

Scope:

- Add a small helper for production-like env behavior.
- Update `lib/supabase/proxy.ts` so missing public Supabase env throws or returns a clear failure only in production-like environments.
- Add a unit/source guard around the behavior.
- Keep local development behavior unchanged.

Out of scope for that PR:

- changing auth flow;
- changing Supabase clients;
- changing RLS;
- changing routes;
- changing billing;
- changing permissions;
- changing UI.

## Acceptance criteria for follow-up

- Production-like runtime cannot silently skip proxy/session setup when required public Supabase env vars are missing.
- Local development remains usable for setup screens/warnings.
- CI remains aligned with `npm audit --audit-level=moderate` and required env validation.
- Tests/gates pass with `RUN_RLS_TESTS=false`.
