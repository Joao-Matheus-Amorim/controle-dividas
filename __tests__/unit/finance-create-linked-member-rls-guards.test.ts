import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/067_self_scoped_finance_creates_rls.sql"),
  "utf8",
).toLowerCase();

describe("finance create linked-member RLS guards", () => {
  it("versions the self-scoped create boundary for all finance write helpers", () => {
    expect(migration).toContain("create or replace function public.can_manage_organization_bank");
    expect(migration).toContain("create or replace function public.can_manage_organization_expense");
    expect(migration).toContain("create or replace function public.can_manage_organization_payable_bill");
    expect(migration).toContain("create or replace function public.can_manage_organization_receivable_income");
  });

  it("requires non-admin create writes to target the linked family member", () => {
    const createLinkedMemberChecks = [
      "when target_action = 'can_create' then p.linked_family_member_id = target_family_member_id",
      "when target_action = 'can_create' then p.linked_family_member_id = target_responsible_member_id",
      "when target_action = 'can_create' then p.linked_family_member_id = target_receiver_member_id",
    ];

    for (const check of createLinkedMemberChecks) {
      expect(migration).toContain(check);
    }
  });

  it("keeps family and selected scopes out of the create branch", () => {
    const createBranchMatches = migration.match(/when target_action = 'can_create' then p\.linked_family_member_id = target_[a-z_]+/g) ?? [];
    expect(createBranchMatches).toHaveLength(4);

    for (const match of createBranchMatches) {
      expect(match).not.toContain("ump.scope = 'family'");
      expect(match).not.toContain("allowed_member_ids");
    }

    expect(migration).toContain("else (");
    expect(migration).toContain("ump.scope = 'family'");
    expect(migration).toContain("ump.scope = 'selected'");
    expect(migration).toContain("allowed_member_ids");
  });
});
