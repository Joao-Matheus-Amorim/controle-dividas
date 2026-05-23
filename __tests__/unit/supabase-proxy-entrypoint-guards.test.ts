import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("Supabase proxy entrypoint guards", () => {
  it("keeps the root proxy delegated to the central session proxy helper", () => {
    const source = readSource("proxy.ts");

    expect(source).toContain('import { updateSession } from "@/lib/supabase/proxy"');
    expect(source).toContain("export async function proxy(request: NextRequest)");
    expect(source).toContain("return await updateSession(request);");
    expect(source).not.toContain("createServerClient");
    expect(source).not.toContain("organization_memberships");
  });

  it("keeps the matcher broad enough for protected application routes", () => {
    const source = readSource("proxy.ts");

    expect(source).toContain("export const config");
    expect(source).toContain("matcher");
    expect(source).toContain("_next/static");
    expect(source).toContain("_next/image");
    expect(source).toContain("favicon.ico");
    expect(source).toContain("svg|png|jpg|jpeg|gif|webp");
    expect(source).toContain("/((?!_next/static|_next/image|favicon.ico");
    expect(source).not.toContain('"/protected/:path*"');
  });
});
