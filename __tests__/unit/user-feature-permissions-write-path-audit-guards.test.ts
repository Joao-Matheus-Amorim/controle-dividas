import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const auditPath = "docs/audits/USER_FEATURE_PERMISSIONS_WRITE_PATH_AUDIT.md";
const auditedSourcePaths = [
  "lib/finance/admin-server.ts",
  "lib/finance/access-control.ts",
  "app/protected/admin/actions.ts",
] as const;

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function userFeaturePermissionBlocks(source: string) {
  const blocks: string[] = [];
  const marker = '.from("user_feature_permissions")';
  let index = source.indexOf(marker);

  while (index >= 0) {
    blocks.push(source.slice(index, index + 500));
    index = source.indexOf(marker, index + marker.length);
  }

  return blocks;
}

describe("user feature permissions write path audit", () => {
  const audit = normalize(read(auditPath));

  it("documents the current blocked hardening decision", () => {
    expect(audit).toContain("readiness: blocked");
    expect(audit).toContain("no active application write path was found");
    expect(audit).toContain("do not add preflight/dry-run sql or a schema hardening migration");
  });

  it("documents audited read paths and transitional fallback", () => {
    expect(audit).toContain("lib/finance/admin-server.ts");
    expect(audit).toContain("getfamilyfeaturepermissions");
    expect(audit).toContain("lib/finance/access-control.ts");
    expect(audit).toContain("getfeaturepermission");
    expect(audit).toContain("organization_id is null");
  });

  it("does not claim schema hardening readiness", () => {
    expect(audit).not.toContain("readiness: ready");
    expect(audit).not.toContain("readiness: mostly ready");
    expect(audit).not.toContain("next safe step: future dedicated hardening pr");
  });

  it("keeps the audited source surface free of user_feature_permissions writes", () => {
    for (const sourcePath of auditedSourcePaths) {
      const blocks = userFeaturePermissionBlocks(read(sourcePath));

      for (const block of blocks) {
        expect(block).not.toMatch(/\.insert\s*\(/);
        expect(block).not.toMatch(/\.upsert\s*\(/);
        expect(block).not.toMatch(/\.update\s*\(/);
        expect(block).not.toMatch(/\.delete\s*\(/);
      }
    }
  });
});
