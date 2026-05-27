# Expense Categories RLS Fallback Removal

## Scope

This runbook applies only to:

```txt
supabase/migrations/030_expense_categories_rls_remove_legacy_fallback.sql
public.expense_categories
```

The migration removes the legacy `organization_id IS NULL` fallback from the `expense_categories` RLS policies after `organization_id` was hardened to `NOT NULL`.

It does not alter data, routes, UI, billing, or other tables.

## Pre-apply checks

Before applying in a persistent environment, confirm:

```sql
select count(*) as null_organization_rows
from public.expense_categories
where organization_id is null;
```

Expected:

```txt
0
```

## Rollback SQL

Rollback restores the transitional policies from migrations `008` and `009`.

```sql
drop policy if exists "expense_categories_select_organization" on public.expense_categories;
drop policy if exists "expense_categories_insert_owner_organization" on public.expense_categories;
drop policy if exists "expense_categories_update_owner_organization" on public.expense_categories;
drop policy if exists "expense_categories_delete_owner_organization" on public.expense_categories;

create policy "expense_categories_select_organization_or_legacy"
on public.expense_categories
for select
using (
  (
    organization_id is not null
    and public.is_organization_member(organization_id)
  )
  or (
    organization_id is null
    and owner_id = auth.uid()
  )
);

create policy "expense_categories_insert_organization_or_legacy"
on public.expense_categories
for insert
with check (
  owner_id = auth.uid()
  and (
    (
      organization_id is not null
      and public.is_organization_member(organization_id)
    )
    or organization_id is null
  )
);

create policy "expense_categories_update_owner_organization_or_legacy"
on public.expense_categories
for update
using (
  owner_id = auth.uid()
  and (
    (
      organization_id is not null
      and public.is_organization_member(organization_id)
    )
    or organization_id is null
  )
)
with check (
  owner_id = auth.uid()
  and organization_id is not null
  and public.is_organization_member(organization_id)
);

create policy "expense_categories_delete_owner_organization_or_legacy"
on public.expense_categories
for delete
using (
  owner_id = auth.uid()
  and (
    (
      organization_id is not null
      and public.is_organization_member(organization_id)
    )
    or organization_id is null
  )
);
```

## Post-apply validation

Run the gated RLS coverage for `expense_categories` in the configured RLS environment.

The expected behavior is:

- a user with active membership can read rows from that organization;
- a user without membership cannot read rows from another organization;
- `organization_id IS NULL` is no longer a valid runtime path for this table.

