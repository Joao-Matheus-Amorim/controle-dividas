import { describe, expect, it, vi } from "vitest";

import { getFamilyMembersByOwnerFromClient } from "@/lib/finance/members-server";

function createFamilyMembersClient(data: unknown[] | null, error: { message: string } | null = null) {
  const order = vi.fn(async () => ({ data, error }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    client: { from },
    calls: { from, select, eq, order },
  };
}

describe("finance members server", () => {
  it("reads family members scoped by owner and ordered by creation time", async () => {
    const ownerId = "owner-123";
    const memberRows = [
      {
        id: "member-1",
        owner_id: ownerId,
        name: "Member 1",
        role: "Responsável",
        monthly_limit: 1000,
        currency: "BRL",
        is_active: true,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    const { client, calls } = createFamilyMembersClient(memberRows);

    const result = await getFamilyMembersByOwnerFromClient(client, ownerId);

    expect(result).toEqual(memberRows);
    expect(calls.from).toHaveBeenCalledWith("family_members");
    expect(calls.select).toHaveBeenCalledWith(
      "id, owner_id, name, role, monthly_limit, currency, is_active, created_at",
    );
    expect(calls.eq).toHaveBeenCalledWith("owner_id", ownerId);
    expect(calls.order).toHaveBeenCalledWith("created_at", { ascending: true });
  });

  it("returns an empty list when Supabase returns null data", async () => {
    const { client } = createFamilyMembersClient(null);

    await expect(getFamilyMembersByOwnerFromClient(client, "owner-123")).resolves.toEqual([]);
  });

  it("throws Supabase read errors", async () => {
    const { client } = createFamilyMembersClient(null, { message: "read failed" });

    await expect(getFamilyMembersByOwnerFromClient(client, "owner-123")).rejects.toThrow(
      "read failed",
    );
  });
});
