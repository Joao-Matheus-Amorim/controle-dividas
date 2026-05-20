import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("onboarding redirect guards", () => {
  it("keeps protected routes requiring an active organization context", () => {
    const source = readSource("lib/supabase/proxy.ts");

    expect(source).toContain(
      'const INITIAL_ORGANIZATION_ONBOARDING_PATH = "/onboarding/organizacao"',
    );
    expect(source).toContain("function shouldRequireOrganization(pathname: string)");
    expect(source).toContain('pathname === "/protected"');
    expect(source).toContain('pathname.startsWith("/protected/")');
    expect(source).toContain("async function hasActiveOrganizationMembership");
    expect(source).toContain('from("organization_memberships")');
    expect(source).toContain('.eq("auth_user_id", authUserId)');
    expect(source).toContain('.eq("is_active", true)');
    expect(source).toContain("shouldRequireOrganization(request.nextUrl.pathname)");
    expect(source).toContain("url.pathname = INITIAL_ORGANIZATION_ONBOARDING_PATH");
  });

  it("keeps onboarding outside the protected organization requirement", () => {
    const source = readSource("lib/supabase/proxy.ts");

    expect(source).not.toContain('pathname.startsWith("/onboarding")');
    expect(source).not.toContain('pathname === "/onboarding/organizacao" && !user');
  });

  it("preserves Supabase cookies when creating redirect responses", () => {
    const source = readSource("lib/supabase/proxy.ts");

    expect(source).toContain("function redirectWithSupabaseCookies");
    expect(source).toContain("NextResponse.redirect(url)");
    expect(source).toContain("supabaseResponse.cookies.getAll().forEach");
    expect(source).toContain("redirectResponse.cookies.set(cookie)");
    expect(source).toContain(
      "return redirectWithSupabaseCookies(url, supabaseResponse);",
    );
    expect(source).not.toContain("return NextResponse.redirect(url);");
  });
});