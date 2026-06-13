-- Remove anonymous API visibility from sensitive application tables.
-- Authenticated users keep table privileges; row-level security policies still
-- decide which organization rows each user can read or mutate.

do $$
declare
  table_name text;
  sensitive_tables text[] := array[
    'banks',
    'categories',
    'debt',
    'expense_categories',
    'expenses',
    'family_members',
    'organization_memberships',
    'organizations',
    'payable_bills',
    'payments',
    'profiles',
    'receivable_incomes',
    'user_feature_permissions',
    'user_module_permissions'
  ];
begin
  foreach table_name in array sensitive_tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('revoke all on table public.%I from public', table_name);
      execute format('revoke all on table public.%I from anon', table_name);
      execute format(
        'grant select, insert, update, delete on table public.%I to authenticated',
        table_name
      );
    end if;
  end loop;
end $$;
