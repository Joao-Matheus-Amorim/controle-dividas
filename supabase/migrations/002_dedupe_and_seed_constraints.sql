-- FamilyFinance dedupe and seed safety
-- Run after 001_family_finance_schema.sql if duplicated default people/categories were created.

-- 1) Repoint child records to the first record kept for each duplicated family member name.
with duplicated_members as (
  select
    id,
    first_value(id) over (
      partition by owner_id, lower(trim(name))
      order by created_at asc, id asc
    ) as keep_id,
    row_number() over (
      partition by owner_id, lower(trim(name))
      order by created_at asc, id asc
    ) as rn
  from public.family_members
)
update public.expenses e
set family_member_id = dm.keep_id
from duplicated_members dm
where e.family_member_id = dm.id
  and dm.rn > 1;

with duplicated_members as (
  select
    id,
    first_value(id) over (
      partition by owner_id, lower(trim(name))
      order by created_at asc, id asc
    ) as keep_id,
    row_number() over (
      partition by owner_id, lower(trim(name))
      order by created_at asc, id asc
    ) as rn
  from public.family_members
)
update public.payable_bills b
set responsible_member_id = dm.keep_id
from duplicated_members dm
where b.responsible_member_id = dm.id
  and dm.rn > 1;

with duplicated_members as (
  select
    id,
    first_value(id) over (
      partition by owner_id, lower(trim(name))
      order by created_at asc, id asc
    ) as keep_id,
    row_number() over (
      partition by owner_id, lower(trim(name))
      order by created_at asc, id asc
    ) as rn
  from public.family_members
)
update public.receivable_incomes r
set receiver_member_id = dm.keep_id
from duplicated_members dm
where r.receiver_member_id = dm.id
  and dm.rn > 1;

with duplicated_members as (
  select
    id,
    first_value(id) over (
      partition by owner_id, lower(trim(name))
      order by created_at asc, id asc
    ) as keep_id,
    row_number() over (
      partition by owner_id, lower(trim(name))
      order by created_at asc, id asc
    ) as rn
  from public.family_members
)
update public.banks bank
set family_member_id = dm.keep_id
from duplicated_members dm
where bank.family_member_id = dm.id
  and dm.rn > 1;

-- 2) Delete duplicated family members, preserving the earliest record for each owner/name.
with duplicated_members as (
  select
    id,
    row_number() over (
      partition by owner_id, lower(trim(name))
      order by created_at asc, id asc
    ) as rn
  from public.family_members
)
delete from public.family_members fm
using duplicated_members dm
where fm.id = dm.id
  and dm.rn > 1;

-- 3) Repoint expenses to the first category kept for each duplicated category name.
with duplicated_categories as (
  select
    id,
    first_value(id) over (
      partition by owner_id, lower(trim(name))
      order by is_default desc, created_at asc, id asc
    ) as keep_id,
    row_number() over (
      partition by owner_id, lower(trim(name))
      order by is_default desc, created_at asc, id asc
    ) as rn
  from public.expense_categories
)
update public.expenses e
set category_id = dc.keep_id
from duplicated_categories dc
where e.category_id = dc.id
  and dc.rn > 1;

-- 4) Delete duplicated categories, preserving default/earliest records.
with duplicated_categories as (
  select
    id,
    row_number() over (
      partition by owner_id, lower(trim(name))
      order by is_default desc, created_at asc, id asc
    ) as rn
  from public.expense_categories
)
delete from public.expense_categories ec
using duplicated_categories dc
where ec.id = dc.id
  and dc.rn > 1;

-- 5) Add unique indexes that make the automatic seed idempotent.
create unique index if not exists family_members_owner_name_unique_idx
on public.family_members (owner_id, lower(trim(name)));

create unique index if not exists expense_categories_owner_name_unique_idx
on public.expense_categories (owner_id, lower(trim(name)));
