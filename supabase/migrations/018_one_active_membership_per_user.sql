-- FamilyFinance SaaS multi-tenant transition
-- Prevent concurrent onboarding from creating multiple active memberships
-- for the same authenticated user before active organization selection exists.
--
-- This is intentionally transitional. Revisit before implementing support for
-- multiple active organizations per user or organization selector switching.

create unique index if not exists organization_memberships_one_active_per_user_idx
  on public.organization_memberships(auth_user_id)
  where is_active = true;
