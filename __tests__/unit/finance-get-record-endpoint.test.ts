import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getCurrentOrganizationProfile: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/finance/access-control", () => ({
  getCurrentOrganizationProfile: mocks.getCurrentOrganizationProfile,
}));

function makeRequest(path: string) {
  return new Request(`http://localhost${path}`) as never;
}

function makeQuery(result: unknown = { id: "expense-1" }) {
  const eqCalls: Array<[string, string]> = [];
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((column: string, value: string) => {
      eqCalls.push([column, value]);
      return query;
    }),
    maybeSingle: vi.fn(async () => ({ data: result, error: null })),
  };

  return { query, eqCalls };
}

describe("GET /api/finance/get-record", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.getCurrentOrganizationProfile.mockResolvedValue({
      id: "profile-1",
      organization_id: "org-1",
      is_active: true,
    });
  });

  it("requires an authenticated user", async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) },
    });

    const { GET } = await import("@/app/api/finance/get-record/route");
    const response = await GET(makeRequest("/api/finance/get-record?entity=expense&id=expense-1"));

    expect(response.status).toBe(401);
  });

  it("rejects unknown entities before querying finance tables", async () => {
    const from = vi.fn();
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) },
      from,
    });

    const { GET } = await import("@/app/api/finance/get-record/route");
    const response = await GET(makeRequest("/api/finance/get-record?entity=unknown&id=x"));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("scopes record lookup by the active organization", async () => {
    const { query, eqCalls } = makeQuery({ id: "expense-1", organization_id: "org-1" });
    const from = vi.fn(() => query);
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) },
      from,
    });

    const { GET } = await import("@/app/api/finance/get-record/route");
    const response = await GET(makeRequest("/api/finance/get-record?entity=expense&id=expense-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result).toEqual({ id: "expense-1", organization_id: "org-1" });
    expect(from).toHaveBeenCalledWith("expenses");
    expect(query.select).toHaveBeenCalledWith("*");
    expect(eqCalls).toContainEqual(["id", "expense-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-1"]);
  });
});
