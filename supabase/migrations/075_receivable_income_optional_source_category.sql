-- Allows receivable incomes to keep payer/origin details open-ended while
-- adding an optional receivable-specific category.

alter table public.receivable_incomes
  add column if not exists category text;

alter table public.receivable_incomes
  alter column source drop not null;

comment on column public.receivable_incomes.source is
  'Optional open-text origin/type of the receivable income.';

comment on column public.receivable_incomes.category is
  'Optional open-text category specific to receivable income records.';
