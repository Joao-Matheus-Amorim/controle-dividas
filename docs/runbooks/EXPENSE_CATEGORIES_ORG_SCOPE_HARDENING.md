# Expense Categories Organization Scope Hardening

Issue: #568

## Purpose

Document the operational notes for hardening `public.expense_categories.organization_id`.

This runbook applies only to the migration:

```txt
supabase/migrations/018_expense_categories_organization_scope_hardening.sql
```

## Scope

This change is intentionally limited to:

```txt
public.expense_categories.organization_id
```

It does not target any other table.

## Required pre-apply checks

Before applying the migration in any persistent environment, run and save the output of:

```txt
docs/sql/legacy-organization-null-preflight.sql
docs/sql/legacy-organization-backfill-dry-run.sql
```

The target table must show:

```txt
expense_categories | 0 null organization rows
expense_categories | 0 blocked rows
expense_categories | 0 ambiguous rows
```

The migration also includes its own preflight guard and will fail before applying the schema change if any `public.expense_categories.organization_id IS NULL` rows exist.

## Rollback

Rollback is schema-only. It does not restore or change data.

If the constraint needs to be reverted, run:

```sql
ALTER TABLE public.expense_categories
  ALTER COLUMN organization_id DROP NOT NULL;
```

After rollback, re-run:

```txt
docs/sql/legacy-organization-null-preflight.sql
docs/sql/legacy-organization-backfill-dry-run.sql
```

## Explicitly out of scope

This change does not:

- update data;
- backfill data;
- alter `profiles`;
- alter any other tenant-scoped table;
- change RLS policies;
- change runtime actions;
- change UI;
- change billing;
- change E2E tests;
- remove legacy `owner_id` fallback.
