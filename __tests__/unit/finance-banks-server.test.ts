import { describe, expect, it, vi } from "vitest";

import {
  getActiveFamilyMembersByOwnerFromClient,
  getBankAccountsFromClient,
} from "@/lib/finance/banks-server";

function createBanksClient(options: {
  accounts?: unknown[] | null;
  accountsError?: { message: string } | null;
  members?: unknown[] | null;
  membersError?: { message: string } | null;
}) {
  const accountOrderCreatedAt = vi.fn(async () => ({
    data: options.accounts ?? [],
    error: options.accountsError ?? null,
  }));
  const accountOrderName = vi.fn(() => ({ order: accountOrderCreatedAt }));
  const accountIn = vi.fn(() => ({ order: accountOrderName }));
  const accountOrganizationEq = vi.fn(() => ({ in: accountIn }));
  const accountOwnerEq = vi.fn(() => ({ eq: accountOrganizationEq }));
  const accountSelect = vi.fn(() => ({ eq: accountOwnerEq }));

  const memberOrder = vi.fn(async () => ({
    data: options.members ?? [],
    error: options.membersError ?? null,
  }));
  const memberActiveEq = vi.fn(() => ({ order: memberOrder }));
  const memberOrganizationEq = vi.fn(() => ({ eq: memberActiveEq }));
  const memberOwnerEq = vi.fn(() => ({ eq: memberOrganizationEq }));
  const memberSelect = vi.fn(() => ({ eq: memberOwnerEq }));

  const from = vi.fn((table: string) => {
    if (table === "banks") {
      return { select: accountSelect };
    }

    return { select: memberSelect };
  });

  return {
    client: { from },
    calls: {
      from,
      accountSelect,
      accountOwnerEq,
      accountOrganizationEq,
      accountIn,
      accountOrderName,
      accountOrderCreatedAt,
      memberSelect,
      memberOwnerEq,
      memberOrganizationEq,
      memberActiveEq,
      memberOrder,
    },
  };
}

describe("finance banks server", () => {
  it("reads bank accounts scoped by organization owner, organization, and accessible members", async () => {
    const scope = { owner_id: "owner-123", organization_id: "org-123" };
    const accessibleMemberIds = ["member-1", "member-2"];
    const accountRows = [
      {
        id: "bank-1",
        owner_id: scope.owner_id,
        family_member_id: "member-1",
        bank_name: "Banco",
        account_type: "corrente",
        current_balance: 123.45,
        currency: "BRL",
        notes: null,
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: [{ id: "member-1", name: "Member 1" }],
      },
    ];
    const { client, calls } = createBanksClient({ accounts: accountRows });

    await expect(getBankAccountsFromClient(client as never, scope, accessibleMemberIds)).resolves.toEqual([
      {
        ...accountRows[0],
        family_members: { id: "member-1", name: "Member 1" },
      },
    ]);

    expect(calls.from).toHaveBeenCalledWith("banks");
    expect(calls.accountOwnerEq).toHaveBeenCalledWith("owner_id", scope.owner_id);
    expect(calls.accountOrganizationEq).toHaveBeenCalledWith(
      "organization_id",
      scope.organization_id,
    );
    expect(calls.accountIn).toHaveBeenCalledWith("family_member_id", accessibleMemberIds);
    expect(calls.accountOrderName).toHaveBeenCalledWith("bank_name", { ascending: true });
    expect(calls.accountOrderCreatedAt).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("returns bank accounts empty without querying when no member ids are accessible", async () => {
    const { client, calls } = createBanksClient({ accounts: [] });

    await expect(
      getBankAccountsFromClient(
        client as never,
        { owner_id: "owner-123", organization_id: "org-123" },
        [],
      ),
    ).resolves.toEqual([]);

    expect(calls.from).not.toHaveBeenCalled();
  });

  it("reads active family members scoped by organization owner and organization", async () => {
    const scope = { owner_id: "owner-123", organization_id: "org-123" };
    const memberRows = [
      {
        id: "member-1",
        owner_id: scope.owner_id,
        name: "Member 1",
        role: "adult",
        monthly_limit: 1000,
        currency: "BRL",
        is_active: true,
        created_at: "2026-05-01T00:00:00.000Z",
      },
    ];
    const { client, calls } = createBanksClient({ members: memberRows });

    await expect(getActiveFamilyMembersByOwnerFromClient(client as never, scope)).resolves.toEqual(
      memberRows,
    );

    expect(calls.from).toHaveBeenCalledWith("family_members");
    expect(calls.memberOwnerEq).toHaveBeenCalledWith("owner_id", scope.owner_id);
    expect(calls.memberOrganizationEq).toHaveBeenCalledWith(
      "organization_id",
      scope.organization_id,
    );
    expect(calls.memberActiveEq).toHaveBeenCalledWith("is_active", true);
    expect(calls.memberOrder).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});
