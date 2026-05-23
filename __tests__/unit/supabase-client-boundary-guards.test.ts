import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

const ignoredPathParts = new Set([
  ".git",
  ".next",
  "coverage",
  "node_modules",
  "playwright-report",
  "test-results",
]);

const allowedSupabaseFactoryFiles = new Set([
  "lib/supabase/admin.ts",
  "lib/supabase/client.ts",
  "lib/supabase/proxy.ts",
  "lib/supabase/server.ts",
]);

const forbiddenFactoryPatterns = [
  /from\s+["']@supabase\/ssr["']/,
  /from\s+["']@supabase\/supabase-js["']/,
  /\bcreateBrowserClient\b/,
  /\bcreateServerClient\b/,
];

function normalizePath(path: string) {
  return path.split(sep).join("/");
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    if (ignoredPathParts.has(entry)) {
      return [];
    }

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return listSourceFiles(fullPath);
    }

    if (!/\.(ts|tsx)$/.test(entry)) {
      return [];
    }

    const relativePath = normalizePath(relative(rootDir, fullPath));

    if (relativePath.endsWith(".d.ts")) {
      return [];
    }

    return [relativePath];
  });
}

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("Supabase client creation boundaries", () => {
  it("keeps direct Supabase client factory usage inside approved wrappers", () => {
    const violations = listSourceFiles(rootDir).filter((path) => {
      if (allowedSupabaseFactoryFiles.has(path)) {
        return false;
      }

      const source = readSource(path);
      return forbiddenFactoryPatterns.some((pattern) => pattern.test(source));
    });

    expect(violations).toEqual([]);
  });
});
