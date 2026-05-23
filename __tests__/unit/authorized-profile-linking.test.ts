import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  profiles: [] as Array<Record<string, unknown>>,
  updates: [] as Array<{ table: string; payload: Record<string, unknown>; filters: Record<string, unknown> }>,
  selectError: null as { message: string } | null,
  updateError: null as { message: string } | null,
}));

function makeProfilesQuery() {
  const filters: Record<string, unknown> = {};
  let selectedLimit: number | null = null;
  let updatePayload: Record<string, unknown> | null = null;

  const query = {
    select() {
      return query;
    },
    ilike(key: string, value: unknown) {
      filters[key] = value;
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;

      if (updatePayload) {
        mockState.updates.push({ table: "profiles", payload: updatePayload, filters: { ...filters } });
        return Promise.resolve({ error: mockState.updateError });
      }

      return query;
    },
    limit(value: number) {
      selectedLimit = value;
      return Promise.resolve({
        data: mockState.profiles.slice(0, selectedLimit),
        error: mockState.selectError,
      });
    },
    update(payload: Record<string, unknown>) {
      updatePayload = payload;
      return query;
    },
  };

  return query;
}

function makeAdminClient() {
  return {
    from(table: string) {
      if (table !== "profiles") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return makeProfilesQuery();
    },
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => makeAdminClient()),
}));

function profile(overrides: Record<string, unknown> = {}) {
  return {
    id: "profile-1",
    owner_id: "owner-1",
    organization_id: "org-1",
    auth_user_id: null,
    linked_family_member_id: "member-1",
    name: "Maria",
    email: "maria@example.com",
    role: "user",
    is_active: true,
    ...overrides,
  };
}

describe("authorized profile email lookup", () => {
  beforeEach(() => {
    mockState.profiles = [];
    mockState.updates = [];
    mockState.selectError = null;
    mockState.updateError = null;
    vi.resetModules();
  });

  it("returns missing_email for empty email", async () => {
    const { findAuthorizedProfilesByEmail } = await import("@/lib/finance/authorized-profile-lookup");

    await expect(findAuthorizedProfilesByEmail("   ")).resolves.toEqual({
      status: "missing_email",
      profiles: [],
    });
  });

  it("returns not_found when no authorized profile exists", async () => {
    const { findAuthorizedProfilesByEmail } = await import("@/lib/finance/authorized-profile-lookup");

    await expect(findAuthorizedProfilesByEmail("maria@example.com")).resolves.toEqual({
      status: "not_found",
      profiles: [],
    });
  });

  it("returns duplicate when more than one profile matches the email", async () => {
    const { findAuthorizedProfilesByEmail } = await import("@/lib/finance/authorized-profile-lookup");
    mockState.profiles = [
      profile({ id: "profile-1", organization_id: "org-1" }),
      profile({ id: "profile-2", organization_id: "org-2" }),
    ];

    const result = await findAuthorizedProfilesByEmail("maria@example.com");

    expect(result.status).toBe("duplicate");
    expect(result.profiles).toHaveLength(2);
  });

  it("links only when a single active profile matches", async () => {
    const { linkAuthUserToFamilyProfile } = await import("@/lib/finance/profile-linking");
    mockState.profiles = [profile()];

    const result = await linkAuthUserToFamilyProfile({
      authUserId: "auth-user-1",
      email: "maria@example.com",
    });

    expect(result).toEqual({ linked: true, reason: "linked" });
    expect(mockState.updates).toEqual([
      {
        table: "profiles",
        payload: { auth_user_id: "auth-user-1" },
        filters: { id: "profile-1" },
      },
    ]);
  });

  it("does not link when email is ambiguous", async () => {
    const { linkAuthUserToFamilyProfile } = await import("@/lib/finance/profile-linking");
    mockState.profiles = [
      profile({ id: "profile-1", organization_id: "org-1" }),
      profile({ id: "profile-2", organization_id: "org-2" }),
    ];

    const result = await linkAuthUserToFamilyProfile({
      authUserId: "auth-user-1",
      email: "maria@example.com",
    });

    expect(result).toEqual({ linked: false, reason: "duplicate_authorized_email" });
    expect(mockState.updates).toHaveLength(0);
  });

  it("does not link inactive profiles", async () => {
    const { linkAuthUserToFamilyProfile } = await import("@/lib/finance/profile-linking");
    mockState.profiles = [profile({ is_active: false })];

    const result = await linkAuthUserToFamilyProfile({
      authUserId: "auth-user-1",
      email: "maria@example.com",
    });

    expect(result).toEqual({ linked: false, reason: "profile_inactive" });
    expect(mockState.updates).toHaveLength(0);
  });
});
