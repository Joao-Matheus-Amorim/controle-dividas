-- Banks organization_id null preflight
-- Issue: #604
--
-- Read-only, table-scoped preflight for future banks.organization_id hardening.
-- Run this before any future NOT NULL migration for public.banks.
--
-- This file must remain SELECT-only. Do not add INSERT, UPDATE, DELETE, ALTER,
-- DROP, TRUNCATE, CREATE, GRANT, REVOKE, MERGE, CALL, or migration statements.

select
  'banks' as table_name,
  count(*) as null_organization_rows
from public.banks
where organization_id is null;
