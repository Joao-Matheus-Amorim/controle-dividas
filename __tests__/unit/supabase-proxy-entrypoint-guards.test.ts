import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

function stripBlockComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function getRootProxyMatcherSource() {
  const source = stripBlockComments(readSource("proxy.ts"));
  const matcherMatch = source.match(/matcher:\s*\[\s*(["'`])([\s\S]*?)\1\s*,?\s*\]/);

  if (!matcherMatch?.[2]) {
    throw new Error("Could not find root proxy config.matcher string.");
  }

  return matcherMatch[2];
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

  it("keeps the runtime matcher broad enough for protected application routes", () => {
    const matcherSource = getRootProxyMatcherSource();

    expect(matcherSource).toBe(
      "/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    );
    expect(matcherSource).toContain("_next/static");
    expect(matcherSource).toContain("_next/image");
    expect(matcherSource).toContain("favicon.ico");
    expect(matcherSource).toContain("svg|png|jpg|jpeg|gif|webp");
    expect(matcherSource).not.toBe("/protected/:path*");
  });
});
