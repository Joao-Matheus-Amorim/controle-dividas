-- Expenses organization_id null preflight
-- Issue: #586
--
-- Read-only, table-scoped preflight for future expenses.organization_id hardening.
-- Run this before any future NOT NULL migration for public.expenses.
--
-- This file must remain SELECT-only. Do not add INSERT, UPDATE, DELETE, ALTER,
-- DROP, TRUNCATE, CREATE, GRANT, REVOKE, MERGE, CALL, or migration statements.

select
  'expenses' as table_name,
  count(*) as null_organization_rows
from public.expenses
where organization_id is null;
