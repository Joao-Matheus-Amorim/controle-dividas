-- Payable bills organization_id null preflight
-- Issue: #592
--
-- Read-only, table-scoped preflight for future payable_bills.organization_id hardening.
-- Run this before any future NOT NULL migration for public.payable_bills.
--
-- This file must remain SELECT-only. Do not add INSERT, UPDATE, DELETE, ALTER,
-- DROP, TRUNCATE, CREATE, GRANT, REVOKE, MERGE, CALL, or migration statements.

select
  'payable_bills' as table_name,
  count(*) as null_organization_rows
from public.payable_bills
where organization_id is null;
