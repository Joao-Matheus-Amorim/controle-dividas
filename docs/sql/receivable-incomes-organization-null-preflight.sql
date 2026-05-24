-- Receivable incomes organization_id null preflight
-- Issue: #598
--
-- Read-only, table-scoped preflight for future receivable_incomes.organization_id hardening.
-- Run this before any future NOT NULL migration for public.receivable_incomes.
--
-- This file must remain SELECT-only. Do not add INSERT, UPDATE, DELETE, ALTER,
-- DROP, TRUNCATE, CREATE, GRANT, REVOKE, MERGE, CALL, or migration statements.

select
  'receivable_incomes' as table_name,
  count(*) as null_organization_rows
from public.receivable_incomes
where organization_id is null;
