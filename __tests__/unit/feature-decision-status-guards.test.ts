import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("feature decision status", () => {
  const status = read("docs/audits/FEATURE_DECISION_STATUS.md");

  it("records that feature permissions will be used while hardening remains blocked", () => {
    expect(status).toContain("decision status: use feature permissions");
    expect(status).toContain("hardening status: blocked until scoped write path exists");
    expect(status).not.toContain("hardening status: ready");
    expect(status).not.toContain("decision status: pending");
  });

  it("keeps the next step explicit", () => {
    expect(status).toContain("the product will keep and use feature permissions");
    expect(status).toContain("the next implementation step is a separate scoped write-path pr");
    expect(status).toContain("writes set organization scope from the active organization");
  });

  it("keeps this PR out of implementation changes", () => {
    expect(status).toContain("no migration");
    expect(status).toContain("no schema change");
    expect(status).toContain("no data change");
    expect(status).toContain("no runtime change");
  });
});
