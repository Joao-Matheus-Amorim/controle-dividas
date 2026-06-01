# Family Members RLS Fallback Removal

> Status DocDoc: Parcialmente superado/historico
> Uso seguro: contexto e rollback da migration de remocao de fallback RLS
> citada.
> Superado por / observacao: confirmar migrations `030` a `043`, politicas
> atuais e banco alvo antes de executar SQL.

## Scope

This runbook applies only to:

```txt
supabase/migrations/031_family_members_rls_remove_legacy_fallback.sql
public.family_members
```

The migration removes the legacy `organization_id IS NULL` fallback from the `family_members` RLS policies after `organization_id` was hardened to `NOT NULL`.

It does not alter data, routes, UI, billing, or other tables.

## Pre-apply checks

Before applying in a persistent environment, confirm:

```sql
select count(*) as null_organization_rows
from public.family_members
where organization_id is null;
```

Expected:

```txt
0
```

## Rollback SQL

Rollback restores the transitional policies from migration `010`.

```sql
drop policy if exists "family_members_select_organization" on public.family_members;
drop policy if exists "family_members_insert_owner_organization" on public.family_members;
drop policy if exists "family_members_update_owner_organization" on public.family_members;
drop policy if exists "family_members_delete_owner_organization" on public.family_members;

create policy "family_members_select_organization_or_legacy"
on public.family_members
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

create policy "family_members_insert_owner_organization_or_legacy"
on public.family_members
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

create policy "family_members_update_owner_organization_or_legacy"
on public.family_members
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

create policy "family_members_delete_owner_organization_or_legacy"
on public.family_members
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

Run the gated RLS coverage for `family_members` in the configured RLS environment.

The expected behavior is:

- a user with active membership can read members from that organization;
- a user without membership cannot read members from another organization;
- `organization_id IS NULL` is no longer a valid runtime path for this table.

