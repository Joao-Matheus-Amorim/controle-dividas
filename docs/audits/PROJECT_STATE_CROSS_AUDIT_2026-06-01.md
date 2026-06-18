# Project state cross-audit - 2026-06-01

Base: `origin/main` at `e18135a` (`fix: align dashboard quick actions and org links (#832)`).

Purpose: consolidate where the project is, what is actually closed, what remains open, and the safest next sequence without needing another broad scan before each small PR.

## Executive summary

Overall health is strong. The project has a working SaaS-first web/PWA baseline with organization-aware routing, Supabase Auth, organization memberships, RLS hardening, audit/rate-limit runtime coverage for many sensitive operations, CI security checks, Dependabot, CodeQL, and automated deploy.

The main risks are no longer "unknown architecture". The remaining risk is sequencing:

- keep `owner_id` compatibility until the retirement plan is explicit;
- finish Stripe evidence before webhook/subscription sync;
- continue visual token migration in small domain/primitive PRs;
- run live evidence gates instead of declaring proof from local/code inspection only;
- keep documentation status headers current so older plans cannot override the living contracts.

## Snapshot

| Area | Current state |
| --- | --- |
| Main branch | `origin/main` at `e18135a`, includes #832 |
| Open PR queue | none observed during audit |
| Supabase migrations | `001` through `043` |
| Docs | 147 markdown/sql documentation files under `docs/` |
| Tests/fixtures | 217 files under `__tests__/` and `tests/` |
| Runtime legacy organization fallback | 0 files in `app/`, `components/`, `lib/` matching `organizationOrLegacyFilter` or `organization_id.is.null` |
| Runtime `owner_id` usage | 28 files in `app/`, `components/`, `lib/` still reference `owner_id` |
| Visual legacy token usage | 83 files in `app/` and `components/` still reference old hardcoded visual classes/tokens |
| CI security | `npm audit --audit-level=moderate`, lint, typecheck, build, Vitest |
| Automation | Dependabot weekly, CodeQL, deploy after green CI on `main` |

## Closed or stable

### Multi-tenant runtime

Closed enough for current product operation:

- `/protected` compatibility routes still work.
- `/org/[orgSlug]` routes exist and share implementations through `features/protected-pages`.
- active organization context and switcher exist.
- helper-based org-aware navigation is in place.
- #832 closed the remaining dashboard family-summary hardcoded `/protected/pessoas` link.

Residual risk:

- `/protected` is still a compatibility route, not retired.
- some old docs can still mention `/protected` as the only protected route; use `docs/VALIDACAO_TECNICA.md`, `docs/SAAS_GAP_REGISTER.md`, ADR 0007, and DocDoc status headers as the source of truth.

### RLS and schema hardening

Closed enough for current architecture:

- tenant tables have `organization_id`.
- hardening migrations `020` to `028` enforce organization scope.
- fallback-removal migrations `030` to `038` removed null-organization fallback from RLS.
- `039` versions legacy owner/family policy cleanup.
- `043` restores finance relationships and expects validated FKs.

Residual risk:

- RLS Live Gate still needs dedicated green evidence in GitHub Actions before claiming full external proof.
- `owner_id` remains part of write ownership and compatibility; do not remove casually.

### CI/CD and dependency security

Closed enough for current operation:

- CI validates required env for human PRs and `main`.
- Dependabot PRs use non-secret placeholders where safe.
- `vitest` is patched to `4.1.8` on `origin/main`.
- Vercel project IDs are part of deploy secrets contract.
- Supabase migrations deploy before Vercel production deploy.

Residual risk:

- Deploy is intentionally strict: missing/invalid `SUPABASE_DB_URL`, Vercel IDs, or token should fail.
- `supabase/setup-cli@v1` is still in deploy workflow in the audited snapshot; Dependabot major bumps are ignored automatically, so major action updates should be deliberate PRs.

### Sensitive operation controls

Closed enough for many high-risk runtime paths:

- audit event schema and write boundary exist in migrations `040` and `041`.
- retention cleanup RPC exists in `042`.
- rate limiting exists for auth, onboarding, billing checkout/portal, admin, and core finance mutations.
- audit runtime exists for many authenticated finance/admin/billing operations.

Residual risk:

- storage is process-local memory for current limiter; acceptable for focused initial controls, not durable abuse prevention.
- broader rate limiting and final retention policy are still open under GAP-015.
- public auth flows have no audit runtime because `record_audit_event` requires authenticated organization membership.

### Documentation system

Closed enough for operating with confidence:

- DocDoc status headers exist across current docs.
- high-risk root docs are marked with status/use/supersession notes.
- `docs/VALIDACAO_TECNICA.md` is now the current operational contract and includes migrations `001` to `043`.

Residual risk:

- there are still many historical documents. They are not all wrong, but they are not all current.
- future agents must respect DocDoc status blocks before using old PM, roadmap, or baseline docs.

## Open gaps and debt

### P0 - Evidence gates, not code gaps

1. RLS Live Gate evidence
   - Need: configure dedicated GitHub variables/secrets and run workflow manually.
   - Cost: low to medium, mostly environment setup.
   - Time: 1-2 hours if credentials are ready.
   - Risk if delayed: docs can keep saying "covered by code" without external live proof.

2. Stripe checkout and portal evidence
   - Need: Stripe test account/credentials and runbook execution.
   - Cost: medium, because it crosses Vercel env, Stripe, Supabase, and UI.
   - Time: 0.5-1 day.
   - Risk if skipped: webhook/subscription sync could be built on unproven checkout/portal assumptions.

### P1 - Product/runtime gaps

1. Billing webhook and subscription sync
   - Blocked by real checkout/portal evidence.
   - First PR should implement only webhook pre-agreed scope: signature, raw body, small event set, idempotency decision, rollback.
   - Do not mix with commercial enforcement.

2. Admin bootstrap and invitation model
   - `ADMIN_EMAIL` remains a bootstrap mechanism.
   - Need final invitation/admin membership behavior before removing transitional assumptions.

3. `owner_id` retirement
   - Runtime still references `owner_id` in 28 `app/components/lib` files.
   - This is known compatibility debt, not a surprise bug.
   - Needs inventory, preflight, rollback, migration, and action/read-helper changes in multiple small PRs.

4. Product feature completeness
   - Known gaps from `VALIDACAO_TECNICA.md`: category editing, currency/period/general settings, advanced reports filters/export/charts, dynamic period.

### P2 - UI/design migration

1. Visual token migration
   - 83 `app/components` files still contain old hardcoded token patterns.
   - Dashboard phase is closed; do not remigrate dashboard hero/header/quick actions.
   - Next safe targets: onboarding/auth surfaces, then `components/ui` primitives (`sheet`, `select`, `alert`, `skeleton`, `separator`), then one domain at a time.

2. Snapshot evidence
   - dashboard summary fixture and gated screenshot exist.
   - Need first real gated screenshot execution before broader visual coverage.

### P3 - Documentation hygiene

1. Historical docs
   - 147 docs exist. This is manageable only if DocDoc status blocks remain enforced.
   - Keep updating status headers instead of deleting history.

2. Mojibake risk
   - Some older local branch readings showed mojibake, but `origin/main` current docs are mostly ASCII-safe.
   - Keep PR bodies/docs ASCII unless Portuguese accents are deliberately encoded and verified.

## Recommended next PR sequence

### Sequence A - proof and operations

1. Run and document RLS Live Gate evidence.
2. Run dashboard summary visual snapshot gate.
3. Execute Stripe test checkout and portal evidence runbook.
4. Only then implement Stripe webhook runtime.
5. Then implement subscription sync.
6. Then decide commercial enforcement.

### Sequence B - design migration

1. Auth/login/signup/update-password visual token migration.
2. Onboarding organization visual token migration.
3. `components/ui/sheet.tsx` and `components/ui/select.tsx`.
4. One domain module at a time: Pessoas, Gastos, Contas a pagar, Contas a receber, Bancos, Relatorios, Configuracoes, Admin.
5. Phase 5 cleanup only after grep is zero for old token families.

### Sequence C - data model hardening

1. Create `owner_id` retirement inventory PR only.
2. Add preflight SQL and guards for every owner/write dependency.
3. Move read helpers one domain at a time to organization-first contracts.
4. Move write ownership model only after rollback is documented.
5. Drop or reduce `owner_id` only after live evidence gates pass.

### Sequence D - product completion

1. Dynamic period model for dashboard/reports.
2. Edit flows for expenses/payables/receivables/banks.
3. Category edit and settings expansion.
4. Reports filters/export/charts.
5. Notifications.
6. Client state strategy for filters/pagination/optimistic updates.

## Cost and time estimate

| Workstream | Effort | Calendar estimate | Main blocker |
| --- | --- | --- | --- |
| RLS Live Gate evidence | Low/medium | 1-2 hours | dedicated secrets/users |
| Stripe checkout/portal evidence | Medium | 0.5-1 day | Stripe test credentials and Vercel env |
| Webhook runtime | Medium/high | 1-2 days | idempotency/storage decision |
| Subscription sync | Medium/high | 1-2 days | webhook evidence and plan mapping |
| Owner_id retirement planning | Medium | 0.5-1 day | inventory discipline |
| Owner_id retirement execution | High | multi-PR, 3-7 days | blast radius across actions/RLS/tests |
| Visual token migration remaining | Medium/high | multi-PR, 3-6 days | many files, avoid broad rewrites |
| Product edit/report/settings gaps | Medium/high | multi-PR, 4-10 days | UX decisions and test coverage |

## What not to do

- Do not implement Stripe webhook before real checkout and portal evidence.
- Do not remove `owner_id` inside a visual, billing, or doc PR.
- Do not run broad visual snapshots before the deterministic dashboard snapshot is proven.
- Do not treat old PM/roadmap docs as current if DocDoc marks them as historical or partially superseded.
- Do not use the dirty root checkout as source for PR work; create clean worktrees from `origin/main`.
- Do not merge broad mixed PRs that combine schema, billing, RLS, UI, and docs.

## Immediate next action

Best next action depends on whether the priority is proof, product, or visual polish:

1. If the goal is production confidence: run RLS Live Gate evidence.
2. If the goal is revenue path: execute Stripe checkout/portal evidence runbook.
3. If the goal is visible polish: migrate auth/onboarding surfaces to `--ff-*` tokens.
4. If the goal is long-term architecture: start `owner_id` retirement inventory only.

Recommended default: **RLS Live Gate evidence first**, then **Stripe evidence**, then **one visual migration PR** while billing evidence is being prepared.
