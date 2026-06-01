-- Finance relationship orphan preflight.
--
-- Purpose:
-- Read-only evidence before validating the foreign keys restored as NOT VALID
-- in supabase/migrations/043_restore_finance_relationships_and_rls_cleanup.sql.
--
-- This query must not mutate data or validate constraints. It only counts
-- historical child rows that point to missing parent rows.

with orphan_checks as (
  select
    'expenses.family_member_id -> family_members.id' as relationship,
    count(*) filter (
      where expenses.family_member_id is not null
        and family_members.id is null
    ) as orphan_rows
  from public.expenses
  left join public.family_members
    on family_members.id = expenses.family_member_id

  union all

  select
    'expenses.category_id -> expense_categories.id' as relationship,
    count(*) filter (
      where expenses.category_id is not null
        and expense_categories.id is null
    ) as orphan_rows
  from public.expenses
  left join public.expense_categories
    on expense_categories.id = expenses.category_id

  union all

  select
    'payable_bills.responsible_member_id -> family_members.id' as relationship,
    count(*) filter (
      where payable_bills.responsible_member_id is not null
        and family_members.id is null
    ) as orphan_rows
  from public.payable_bills
  left join public.family_members
    on family_members.id = payable_bills.responsible_member_id

  union all

  select
    'receivable_incomes.receiver_member_id -> family_members.id' as relationship,
    count(*) filter (
      where receivable_incomes.receiver_member_id is not null
        and family_members.id is null
    ) as orphan_rows
  from public.receivable_incomes
  left join public.family_members
    on family_members.id = receivable_incomes.receiver_member_id

  union all

  select
    'banks.family_member_id -> family_members.id' as relationship,
    count(*) filter (
      where banks.family_member_id is not null
        and family_members.id is null
    ) as orphan_rows
  from public.banks
  left join public.family_members
    on family_members.id = banks.family_member_id
)
select
  relationship,
  orphan_rows,
  case
    when orphan_rows = 0 then 'ready_for_validation'
    else 'cleanup_required'
  end as validation_status
from orphan_checks
order by relationship;
