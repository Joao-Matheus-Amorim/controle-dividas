# Profiles organization scope hardening runbook

Issue: #639
Migration: `supabase/migrations/028_profiles_organization_scope_hardening.sql`

> Status DocDoc: Parcialmente superado/historico
> Uso seguro: contexto e rollback da migration de hardening citada.
> Superado por / observacao: confirmar migrations `020` a `043`,
> `docs/VALIDACAO_TECNICA.md` e o banco alvo antes de operar.

## Purpose

Apply schema-only hardening to require `organization_id` on `profiles`.

## Preconditions

Run and review the read-only checks before applying the migration:

```txt
docs/sql/profile-organization-null-check.sql
docs/sql/profile-organization-dry-run.sql
```

Required evidence:

```txt
null_organization_rows = 0
total_legacy_null_organization_rows = 0
needs_review = 0
```

Do not apply the migration if any legacy null-organization profile remains.

## Apply

Apply the migration only after CI is green and the evidence above is reviewed.

The migration has a local preflight guard. It raises an exception before `ALTER TABLE` if any target row still has `organization_id IS NULL`.

## Validation after apply

Run:

```sql
select
  'profiles' as table_name,
  count(*) as null_organization_rows
from "public"."profiles"
where "organization_id" is null;
```

Expected:

```txt
null_organization_rows = 0
```

## Rollback

Rollback is schema-only. It does not restore data and does not change RLS or runtime code.

To roll back the schema constraint:

```sql
alter table "public"."profiles"
  alter column "organization_id" drop not null;
```

This puts the column back to nullable.

## Out of scope

This runbook does not change:

- runtime behavior;
- UI behavior;
- RLS policies;
- billing;
- E2E;
- data values;
- legacy `owner_id` fallback;
- legacy fallback removal.
