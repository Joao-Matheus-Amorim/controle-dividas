import { beforeEach, describe, expect, it, vi } from "vitest";

import { FEATURE_PERMISSIONS, type PermissionAction } from "@/lib/finance/permissions";

const mockState = vi.hoisted(() => ({
  userId: "auth-user-1",
  email: "member@example.com",
  organizationId: "org-1",
  familyMembers: [
    { id: "member-1", owner_id: "owner-1", organization_id: "org-1", is_active: true },
    { id: "member-2", owner_id: "owner-1", organization_id: "org-1", is_active: true },
    { id: "member-3", owner_id: "owner-1", organization_id: "org-1", is_active: true },
  ] as Array<{
    id: string;
    owner_id: string;
    organization_id: string | null;
    is_active: boolean;
  }>,
  profile: {
    id: "profile-1",
    owner_id: "owner-1",
    organization_id: "org-1" as string | null,
    auth_user_id: "auth-user-1",
    linked_family_member_id: "member-own",
    name: "Member",
    email: "member@example.com",
    role: "user",
    is_active: true,
  },
  modulePermissions: [] as Array<{
    profile_id: string;
    organization_id: string | null;
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
    organization_id: string | null;
    feature_key: string;
    is_enabled: boolean;
  }>,
  queryLog: [] as Array<{ table: string; op: "eq" | "or"; key?: string; value: unknown }>,
}));

function matchesFilters<T extends Record<string, unknown>>(row: T, filters: Record<string, unknown>) {
  return Object.entries(filters).every(([key, value]) => row[key] === value);
}

function makeQuery(table: string) {
  const filters: Record<string, unknown> = {};

  function resolveMany() {
    if (table === "family_members") {
      const data = mockState.familyMembers.filter((member) => matchesFilters(member, filters));
      return { data: data.map((member) => ({ id: member.id })), error: null };
    }

    if (table === "user_module_permissions") {
      const data = mockState.modulePermissions.filter((permission) => matchesFilters(permission, filters));
      return { data, error: null };
    }

    if (table === "user_feature_permissions") {
      const data = mockState.featurePermissions.filter((permission) => matchesFilters(permission, filters));
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
      mockState.queryLog.push({ table, op: "eq", key, value });
      return query;
    },
    or(value: string) {
      mockState.queryLog.push({ table, op: "or", value });
      return query;
    },
    ilike(key: string, value: string) {
      filters[key] = value.toLowerCase();
      mockState.queryLog.push({ table, op: "eq", key, value: value.toLowerCase() });
      return query;
    },
    limit() {
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

vi.mock("@/lib/organizations/server", () => ({
  requireOrganizationAccess: vi.fn(async () => ({
    organization: {
      id: mockState.organizationId,
      slug: "family-test",
      name: "Family Test",
      owner_auth_user_id: "owner-1",
      plan: "free",
      status: "active",
      trial_ends_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    membership: {
      id: "membership-1",
      organization_id: mockState.organizationId,
      auth_user_id: mockState.userId,
      role: "member",
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  })),
}));

vi.mock("@/lib/finance/profile-linking", () => ({
  linkAuthUserToFamilyProfile: vi.fn(async () => ({ linked: true, reason: "linked" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getClaims: async () => ({
        data: { claims: { sub: mockState.userId, email: mockState.email } },
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
  organizationId = mockState.organizationId,
}: {
  action: PermissionAction;
  scope: "own" | "selected" | "family";
  allowedMemberIds?: string[] | null;
  organizationId?: string | null;
}) {
  mockState.modulePermissions = [
    {
      profile_id: "profile-1",
      organization_id: organizationId,
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

function expectNoLegacyRuntimePermissionFallback() {
  const runtimePermissionTables = ["family_members", "user_module_permissions", "user_feature_permissions"];
  const runtimeQueries = mockState.queryLog.filter((entry) => runtimePermissionTables.includes(entry.table));

  expect(runtimeQueries).not.toContainEqual(
    expect.objectContaining({ op: "or", value: expect.stringContaining("organization_id.is.null") }),
  );
}

describe("access-control RBAC", () => {
  beforeEach(() => {
    mockState.userId = "auth-user-1";
    mockState.email = "member@example.com";
    mockState.organizationId = "org-1";
    mockState.familyMembers = [
      { id: "member-1", owner_id: "owner-1", organization_id: "org-1", is_active: true },
      { id: "member-2", owner_id: "owner-1", organization_id: "org-1", is_active: true },
      { id: "member-3", owner_id: "owner-1", organization_id: "org-1", is_active: true },
    ];
    mockState.profile = {
      id: "profile-1",
      owner_id: "owner-1",
      organization_id: "org-1",
      auth_user_id: "auth-user-1",
      linked_family_member_id: "member-own",
      name: "Member",
      email: "member@example.com",
      role: "user",
      is_active: true,
    };
    mockState.modulePermissions = [];
    mockState.featurePermissions = [];
    mockState.queryLog = [];
  });

  it("returns own member for own scope", async () => {
    const { getAccessibleMemberIds } = await import("@/lib/finance/access-control");

    setPermission({ action: "can_view", scope: "own" });

    await expect(getAccessibleMemberIds("GASTOS", "can_view")).resolves.toEqual(["member-own"]);
    expectNoLegacyRuntimePermissionFallback();
  });

  it("returns selected members only from the active organization", async () => {
    const { getAccessibleMemberIds } = await import("@/lib/finance/access-control");

    mockState.familyMembers = [
      { id: "member-1", owner_id: "owner-1", organization_id: "org-1", is_active: true },
      { id: "member-org-owner", owner_id: "owner-org-1", organization_id: "org-1", is_active: true },
      { id: "member-legacy", owner_id: "owner-1", organization_id: null, is_active: true },
      { id: "member-other-org", owner_id: "owner-1", organization_id: "org-2", is_active: true },
    ];
    setPermission({
      action: "can_view",
      scope: "selected",
      allowedMemberIds: ["member-1", "member-org-owner", "member-legacy", "member-other-org"],
    });

    await expect(getAccessibleMemberIds("GASTOS", "can_view")).resolves.toEqual(["member-1", "member-org-owner"]);
    expectNoLegacyRuntimePermissionFallback();
  });

  it("returns family scope members only from the active organization", async () => {
    const { getAccessibleMemberIds } = await import("@/lib/finance/access-control");

    mockState.familyMembers = [
      { id: "member-1", owner_id: "owner-1", organization_id: "org-1", is_active: true },
      { id: "member-org-owner", owner_id: "owner-org-1", organization_id: "org-1", is_active: true },
      { id: "member-legacy", owner_id: "owner-1", organization_id: null, is_active: true },
      { id: "member-other-org", owner_id: "owner-1", organization_id: "org-2", is_active: true },
    ];
    setPermission({ action: "can_view", scope: "family" });

    await expect(getAccessibleMemberIds("GASTOS", "can_view")).resolves.toEqual(["member-1", "member-org-owner"]);
    expectNoLegacyRuntimePermissionFallback();
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

  it("ignores legacy module permissions now that runtime permission reads are organization-scoped", async () => {
    const { canViewModule } = await import("@/lib/finance/access-control");

    mockState.modulePermissions = [
      {
        profile_id: "profile-1",
        organization_id: null,
        module: "GASTOS",
        can_view: true,
        can_create: false,
        can_edit: false,
        can_delete: false,
        scope: "family",
        allowed_member_ids: null,
      },
    ];

    await expect(canViewModule("GASTOS")).resolves.toBe(false);
    expectNoLegacyRuntimePermissionFallback();
  });

  it("uses active organization module permissions", async () => {
    const { canViewModule } = await import("@/lib/finance/access-control");

    setPermission({ action: "can_view", scope: "family" });

    await expect(canViewModule("GASTOS")).resolves.toBe(true);
    expect(mockState.queryLog).toContainEqual({
      table: "user_module_permissions",
      op: "eq",
      key: "organization_id",
      value: "org-1",
    });
    expectNoLegacyRuntimePermissionFallback();
  });

  it("ignores module permissions from another organization", async () => {
    const { canViewModule } = await import("@/lib/finance/access-control");

    setPermission({ action: "can_view", scope: "family", organizationId: "org-2" });

    await expect(canViewModule("GASTOS")).resolves.toBe(false);
    expectNoLegacyRuntimePermissionFallback();
  });

  it("admin bypasses module permissions and sees active members only in the active organization", async () => {
    const { getAccessibleMemberIds, getVisibleModuleKeys } = await import("@/lib/finance/access-control");

    mockState.profile.role = "admin";
    mockState.modulePermissions = [];
    mockState.familyMembers = [
      { id: "member-1", owner_id: "owner-1", organization_id: "org-1", is_active: true },
      { id: "member-org-owner", owner_id: "owner-org-1", organization_id: "org-1", is_active: true },
      { id: "member-legacy", owner_id: "owner-1", organization_id: null, is_active: true },
      { id: "member-other-org", owner_id: "owner-1", organization_id: "org-2", is_active: true },
    ];

    await expect(getAccessibleMemberIds("GASTOS", "can_delete")).resolves.toEqual(["member-1", "member-org-owner"]);
    await expect(getVisibleModuleKeys(["GASTOS", "BANCOS"])).resolves.toEqual(["GASTOS", "BANCOS"]);
    expectNoLegacyRuntimePermissionFallback();
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
      { profile_id: "profile-1", organization_id: "org-1", feature_key: feature.key, is_enabled: true },
    ];

    await expect(canUseFeature(feature.key)).resolves.toBe(true);

    mockState.featurePermissions = [
      { profile_id: "profile-1", organization_id: "org-1", feature_key: feature.key, is_enabled: false },
    ];

    await expect(canUseFeature(feature.key)).resolves.toBe(false);

    mockState.featurePermissions = [];
    await expect(canUseFeature(feature.key)).resolves.toBe(false);
    expectNoLegacyRuntimePermissionFallback();
  });

  it("ignores legacy feature permissions now that runtime permission reads are organization-scoped", async () => {
    const { canUseFeature } = await import("@/lib/finance/access-control");
    const feature = FEATURE_PERMISSIONS[0];

    mockState.featurePermissions = [
      { profile_id: "profile-1", organization_id: null, feature_key: feature.key, is_enabled: true },
    ];

    await expect(canUseFeature(feature.key)).resolves.toBe(false);
    expectNoLegacyRuntimePermissionFallback();
  });

  it("ignores feature permissions from another organization", async () => {
    const { canUseFeature } = await import("@/lib/finance/access-control");
    const feature = FEATURE_PERMISSIONS[0];

    mockState.featurePermissions = [
      { profile_id: "profile-1", organization_id: "org-2", feature_key: feature.key, is_enabled: true },
    ];

    await expect(canUseFeature(feature.key)).resolves.toBe(false);
    expectNoLegacyRuntimePermissionFallback();
  });

  it("admin can use every feature permission", async () => {
    const { canUseFeature } = await import("@/lib/finance/access-control");

    mockState.profile.role = "admin";

    for (const feature of FEATURE_PERMISSIONS) {
      await expect(canUseFeature(feature.key)).resolves.toBe(true);
    }
  });
});
