import { beforeEach, describe, expect, it, vi } from "vitest";

import { FEATURE_PERMISSIONS, type FinanceModuleKey, type PermissionAction } from "@/lib/finance/permissions";

const mockState = vi.hoisted(() => ({
  userId: "auth-user-1",
  email: "member@example.com",
  activeMemberIds: ["member-1", "member-2", "member-3"],
  profile: {
    id: "profile-1",
    owner_id: "owner-1",
    auth_user_id: "auth-user-1",
    linked_family_member_id: "member-own",
    name: "Member",
    email: "member@example.com",
    role: "user",
    is_active: true,
  },
  modulePermissions: [] as Array<{
    profile_id: string;
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    scope: "own" | "selected" | "family";
    allowed_member_ids: string[] | null;
  }>,
  featurePermissions: [] as Array<{
    profile_id: string;
    feature_key: string;
    is_enabled: boolean;
  }>,
}));

function makeQuery(table: string) {
  const filters: Record<string, unknown> = {};

  function resolveMany() {
    if (table === "family_members") {
      return {
        data: mockState.activeMemberIds.map((id) => ({ id })),
        error: null,
      };
    }

    if (table === "user_module_permissions") {
      const data = mockState.modulePermissions.filter((permission) => {
        return Object.entries(filters).every(([key, value]) => {
          return permission[key as keyof typeof permission] === value;
        });
      });

      return { data, error: null };
    }

    if (table === "user_feature_permissions") {
      const data = mockState.featurePermissions.filter((permission) => {
        return Object.entries(filters).every(([key, value]) => {
          return permission[key as keyof typeof permission] === value;
        });
      });

      return { data, error: null };
    }

    return { data: [], error: null };
  }

  function resolveSingle() {
    if (table === "profiles") {
      if (filters.auth_user_id === mockState.profile.auth_user_id) {
        return { data: mockState.profile, error: null };
      }

      if (typeof filters.email === "string" && filters.email === mockState.profile.email?.toLowerCase()) {
        return { data: mockState.profile, error: null };
      }

      return { data: null, error: null };
    }

    const many = resolveMany();
    return { data: many.data[0] ?? null, error: many.error };
  }

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;
      return query;
    },
    ilike(key: string, value: string) {
      filters[key] = value.toLowerCase();
      return query;
    },
    maybeSingle() {
      return Promise.resolve(resolveSingle());
    },
    single() {
      return Promise.resolve(resolveSingle());
    },
    then(resolve: (value: unknown) => void) {
      resolve(resolveMany());
    },
  };

  return query;
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/lib/finance/profile-linking", () => ({
  linkAuthUserToFamilyProfile: vi.fn(async () => ({ linked: true, reason: "linked" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getClaims: async () => ({
        data: {
          claims: {
            sub: mockState.userId,
            email: mockState.email,
          },
        },
        error: null,
      }),
    },
    from: (table: string) => makeQuery(table),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => makeQuery(table),
  })),
}));

function setPermission({
  action,
  scope,
  allowedMemberIds = null,
}: {
  action: PermissionAction;
  scope: "own" | "selected" | "family";
  allowedMemberIds?: string[] | null;
}) {
  mockState.modulePermissions = [
    {
      profile_id: "profile-1",
      module: "GASTOS",
      can_view: action === "can_view",
      can_create: action === "can_create",
      can_edit: action === "can_edit",
      can_delete: action === "can_delete",
      scope,
      allowed_member_ids: allowedMemberIds,
    },
  ];
}

describe("access-control RBAC", () => {
  beforeEach(() => {
    mockState.userId = "auth-user-1";
    mockState.email = "member@example.com";
    mockState.activeMemberIds = ["member-1", "member-2", "member-3"];
    mockState.profile = {
      id: "profile-1",
      owner_id: "owner-1",
      auth_user_id: "auth-user-1",
      linked_family_member_id: "member-own",
      name: "Member",
      email: "member@example.com",
      role: "user",
      is_active: true,
    };
    mockState.modulePermissions = [];
    mockState.featurePermissions = [];
  });

  it("returns own member for own scope", async () => {
    const { getAccessibleMemberIds } = await import("@/lib/finance/access-control");

    setPermission({ action: "can_view", scope: "own" });

    await expect(getAccessibleMemberIds("GASTOS", "can_view")).resolves.toEqual(["member-own"]);
  });

  it("returns selected members for selected scope", async () => {
    const { getAccessibleMemberIds } = await import("@/lib/finance/access-control");

    setPermission({ action: "can_view", scope: "selected", allowedMemberIds: ["member-2", "member-3"] });

    await expect(getAccessibleMemberIds("GASTOS", "can_view")).resolves.toEqual(["member-2", "member-3"]);
  });

  it("returns all active members for family scope", async () => {
    const { getAccessibleMemberIds } = await import("@/lib/finance/access-control");

    setPermission({ action: "can_view", scope: "family" });

    await expect(getAccessibleMemberIds("GASTOS", "can_view")).resolves.toEqual(["member-1", "member-2", "member-3"]);
  });

  it.each<PermissionAction>(["can_view", "can_create", "can_edit", "can_delete"])(
    "allows %s only when the matching CRUD flag is true",
    async (action) => {
      const { getAccessibleMemberIds } = await import("@/lib/finance/access-control");

      setPermission({ action, scope: "own" });

      await expect(getAccessibleMemberIds("GASTOS", action)).resolves.toEqual(["member-own"]);

      const otherActions: PermissionAction[] = ["can_view", "can_create", "can_edit", "can_delete"].filter(
        (item): item is PermissionAction => item !== action,
      );

      for (const otherAction of otherActions) {
        await expect(getAccessibleMemberIds("GASTOS", otherAction)).resolves.toEqual([]);
      }
    },
  );

  it("admin bypasses module permissions and sees all active members", async () => {
    const { getAccessibleMemberIds, getVisibleModuleKeys } = await import("@/lib/finance/access-control");

    mockState.profile.role = "admin";
    mockState.modulePermissions = [];

    await expect(getAccessibleMemberIds("GASTOS", "can_delete")).resolves.toEqual(["member-1", "member-2", "member-3"]);
    await expect(getVisibleModuleKeys(["GASTOS", "BANCOS"])).resolves.toEqual(["GASTOS", "BANCOS"]);
  });

  it("inactive profile gets no access", async () => {
    const { getAccessibleMemberIds, getVisibleModuleKeys } = await import("@/lib/finance/access-control");

    mockState.profile.is_active = false;
    setPermission({ action: "can_view", scope: "family" });

    await expect(getAccessibleMemberIds("GASTOS", "can_view")).resolves.toEqual([]);
    await expect(getVisibleModuleKeys(["GASTOS"])).resolves.toEqual([]);
  });

  it("throws when asserting access to a non-permitted member", async () => {
    const { assertCanAccessMember } = await import("@/lib/finance/access-control");

    setPermission({ action: "can_view", scope: "own" });

    await expect(assertCanAccessMember("GASTOS", "can_view", "member-2")).rejects.toThrow(
      "Voce nao tem permissao",
    );
  });

  it.each(FEATURE_PERMISSIONS)("checks feature permission $key", async (feature) => {
    const { canUseFeature } = await import("@/lib/finance/access-control");

    mockState.featurePermissions = [
      { profile_id: "profile-1", feature_key: feature.key, is_enabled: true },
    ];

    await expect(canUseFeature(feature.key)).resolves.toBe(true);

    mockState.featurePermissions = [
      { profile_id: "profile-1", feature_key: feature.key, is_enabled: false },
    ];

    await expect(canUseFeature(feature.key)).resolves.toBe(false);

    mockState.featurePermissions = [];
    await expect(canUseFeature(feature.key)).resolves.toBe(false);
  });

  it("admin can use every feature permission", async () => {
    const { canUseFeature } = await import("@/lib/finance/access-control");

    mockState.profile.role = "admin";

    for (const feature of FEATURE_PERMISSIONS) {
      await expect(canUseFeature(feature.key)).resolves.toBe(true);
    }
  });
});
