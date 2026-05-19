import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("ui primitives guards", () => {
  it("keeps alert primitive available for SaaS feedback states", () => {
    const source = readSource("components/ui/alert.tsx");

    expect(source).toContain('import { cn } from "@/lib/utils"');
    expect(source).toContain("function Alert");
    expect(source).toContain("function AlertTitle");
    expect(source).toContain("function AlertDescription");
    expect(source).toContain('role="alert"');
    expect(source).toContain('variant?: "default" | "destructive"');
    expect(source).toContain("data-slot=\"alert\"");
    expect(source).toContain("data-variant={variant}");
  });

  it("keeps skeleton primitive available for loading states", () => {
    const source = readSource("components/ui/skeleton.tsx");

    expect(source).toContain('import { cn } from "@/lib/utils"');
    expect(source).toContain("function Skeleton");
    expect(source).toContain("animate-pulse");
    expect(source).toContain("data-slot=\"skeleton\"");
    expect(source).toContain("export { Skeleton }");
  });
});