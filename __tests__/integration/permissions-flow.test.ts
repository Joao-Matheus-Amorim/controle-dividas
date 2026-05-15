import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";

import { mockPermissions, mockSupabaseUrl } from "@/__tests__/fixtures/msw-finance-data";
import { mswFinanceHandlers } from "@/__tests__/fixtures/msw-handlers";

type Profile = {
  id: string;
  role: "admin" | "user";
  linked_family_member_id: string;
};

type Permission = {
  profile_id: string;
  module: string;
  can_view: boolean;
  scope: "own" | "selected" | "family";
  allowed_member_ids: string[];
};

type Expense = {
  id: string;
  family_member_id: string;
};

const server = setupServer(...mswFinanceHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function getProfile(profileId: string) {
  const response = await fetch(`${mockSupabaseUrl}/rest/v1/profiles?id=eq.${profileId}`);
  const rows = (await response.json()) as Profile[];
  return rows[0];
}

async function getPermission(profileId: string, moduleName: string) {
  const response = await fetch(
    `${mockSupabaseUrl}/rest/v1/user_module_permissions?profile_id=eq.${profileId}&module=eq.${moduleName}`,
  );
  const rows = (await response.json()) as Permission[];
  return rows[0] ?? null;
}

async function getVisibleExpenses(profileId: string) {
  const profile = await getProfile(profileId);

  if (profile.role === "admin") {
    const memberIds = ["member-admin", "member-own", "member-other"];
    const response = await fetch(
      `${mockSupabaseUrl}/rest/v1/expenses?family_member_id=in.(${memberIds.join(",")})`,
    );
    return (await response.json()) as Expense[];
  }

  const permission = await getPermission(profileId, "GASTOS");

  if (!permission?.can_view) return [];

  const memberIds =
    permission.scope === "family"
      ? ["member-admin", "member-own", "member-other"]
      : permission.scope === "selected"
        ? permission.allowed_member_ids
        : [profile.linked_family_member_id];

  const response = await fetch(
    `${mockSupabaseUrl}/rest/v1/expenses?family_member_id=in.(${memberIds.join(",")})`,
  );

  return (await response.json()) as Expense[];
}

describe("permissions flow integration", () => {
  it("user with own scope does not see data from other members", async () => {
    mockPermissions[0].scope = "own";
    mockPermissions[0].allowed_member_ids = [];

    const rows = await getVisibleExpenses("profile-own");

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("expense-own");
    expect(rows.map((row) => row.family_member_id)).toEqual(["member-own"]);
  });

  it("user with selected scope sees only selected members", async () => {
    mockPermissions[0].scope = "selected";
    mockPermissions[0].allowed_member_ids = ["member-own", "member-other"];

    const rows = await getVisibleExpenses("profile-own");

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.family_member_id).sort()).toEqual(["member-other", "member-own"]);
  });

  it("admin sees all expenses", async () => {
    const rows = await getVisibleExpenses("profile-admin");

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.id).sort()).toEqual(["expense-admin", "expense-other", "expense-own"]);
  });
});
