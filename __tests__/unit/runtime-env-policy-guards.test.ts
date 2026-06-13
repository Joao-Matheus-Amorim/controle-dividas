import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("runtime env policy guards", () => {
  it("keeps production-like runtime fail-fast helper available", () => {
    const source = readSource("lib/utils.ts");
    const normalizedSource = source.replace(/\r\n/g, "\n");

    expect(normalizedSource).toContain(
      "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||\n  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
    expect(source).toContain("export function shouldFailFastForMissingRuntimeEnv()");
    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain('process.env.APP_ENV === "production"');
  });

  it("keeps proxy fail-fast behavior for missing Supabase public env in production-like runtime", () => {
    const source = readSource("lib/supabase/proxy.ts");

    expect(source).toContain("shouldFailFastForMissingRuntimeEnv");
    expect(source).toContain("function assertRuntimeEnvForProxy()");
    expect(source).toContain("if (hasEnvVars)");
    expect(source).toContain("if (shouldFailFastForMissingRuntimeEnv())");
    expect(source).toContain("throw new Error(");
    expect(source).toContain("Supabase public environment variables are missing for the session proxy");
    expect(source).toContain("assertRuntimeEnvForProxy();");
    expect(source).toContain("Local development may run before Supabase env vars are configured.");
  });

  it("keeps metadata base configurable without a hardcoded production URL", () => {
    const source = readSource("app/layout.tsx");

    expect(source).toContain("process.env.NEXT_PUBLIC_APP_URL?.trim()");
    expect(source).toContain("process.env.VERCEL_URL");
    expect(source).toContain('"http://localhost:3000"');
    expect(source).not.toContain("controle-dividas-seven.vercel.app");
    expect(source).not.toContain("controle-dividas-7dcg.vercel.app");
  });
});
