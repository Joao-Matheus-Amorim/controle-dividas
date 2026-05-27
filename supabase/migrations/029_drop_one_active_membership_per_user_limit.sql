-- FamilyFinance SaaS multi-tenant transition
-- allow users to have multiple active organization memberships once
-- organization switching is available.

drop index if exists public.organization_memberships_one_active_per_user_idx;

