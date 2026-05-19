import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("ui primitive usage guards", () => {
  it("keeps protected loading states using the Skeleton primitive", () => {
    const loadingSource = readSource("app/protected/loading.tsx");
    const skeletonSource = readSource("components/app/app-skeleton.tsx");

    expect(loadingSource).toContain("AppPageSkeleton");
    expect(skeletonSource).toContain('@/components/ui/skeleton');
    expect(skeletonSource).toContain("Skeleton");
    expect(skeletonSource).not.toContain("animate-pulse rounded-2xl bg-white/10");
  });

  it("keeps env var warning using the Alert primitive", () => {
    const source = readSource("components/env-var-warning.tsx");

    expect(source).toContain('@/components/ui/alert');
    expect(source).toContain("Alert");
    expect(source).toContain("AlertDescription");
    expect(source).toContain('variant="destructive"');
    expect(source).toContain("Configure as variaveis do Supabase");
  });
});