# Expenses RLS Fallback Removal

> Status DocDoc: Parcialmente superado/historico
> Uso seguro: contexto e rollback da migration de remocao de fallback RLS
> citada.
> Superado por / observacao: confirmar migrations `030` a `067`, politicas
> atuais e banco alvo antes de executar SQL.

## Scope

This runbook applies only to:

```txt
supabase/migrations/032_expenses_rls_remove_legacy_fallback.sql
public.expenses
```

The migration removes the legacy `organization_id IS NULL` fallback from the `expenses` RLS policies after `organization_id` was hardened to `NOT NULL`.

It does not alter data, routes, UI, billing, or other tables.

## Pre-apply checks

Before applying in a persistent environment, confirm:

```sql
select count(*) as null_organization_rows
from public.expenses
where organization_id is null;
```

Expected:

```txt
0
```

## Rollback SQL

Rollback restores the transitional policies from migration `011`.

```sql
drop policy if exists "expenses_select_organization" on public.expenses;
drop policy if exists "expenses_insert_owner_organization" on public.expenses;
drop policy if exists "expenses_update_owner_organization" on public.expenses;
drop policy if exists "expenses_delete_owner_organization" on public.expenses;

create policy "expenses_select_organization_or_legacy"
on public.expenses
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

create policy "expenses_insert_owner_organization_or_legacy"
on public.expenses
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

create policy "expenses_update_owner_organization_or_legacy"
on public.expenses
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

create policy "expenses_delete_owner_organization_or_legacy"
on public.expenses
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

Run the gated RLS coverage for `expenses` in the configured RLS environment.

The expected behavior is:

- a user with active membership can read expenses from that organization;
- a user without membership cannot read expenses from another organization;
- `organization_id IS NULL` is no longer a valid runtime path for this table.

