-- Add payable bill type support for the debt-control MVP.
-- In the MVP, payable bills are the operational home for debts.
-- Bills can be one-off (avulsa) or recurring/fixed (fixa).

alter table public.payable_bills
  add column if not exists bill_type text not null default 'avulsa';

update public.payable_bills
set bill_type = 'fixa'
where bill_type = 'avulsa'
  and recurrence is not null
  and length(trim(recurrence)) > 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payable_bills_bill_type_check'
  ) then
    alter table public.payable_bills
      add constraint payable_bills_bill_type_check
      check (bill_type in ('avulsa', 'fixa'));
  end if;
end $$;

create index if not exists payable_bills_owner_id_bill_type_idx
  on public.payable_bills(owner_id, bill_type);

comment on column public.payable_bills.bill_type is
  'MVP debt-control type: avulsa for one-off bills/debts, fixa for recurring/fixed bills/debts.';

comment on column public.payable_bills.recurrence is
  'Recurrence label for fixed bills. The MVP starts with mensal and can evolve to customized recurrence.';
