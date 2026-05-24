import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("feature decision status", () => {
  const status = read("docs/audits/FEATURE_DECISION_STATUS.md");

  it("keeps hardening blocked until a decision exists", () => {
    expect(status).toContain("decision status: pending");
    expect(status).toContain("hardening status: blocked");
    expect(status).not.toContain("hardening status: ready");
  });

  it("keeps the next step explicit", () => {
    expect(status).toContain("define a scoped write path");
    expect(status).toContain("deprecate the table");
    expect(status).toContain("keep the table blocked");
  });

  it("keeps this PR out of implementation changes", () => {
    expect(status).toContain("no migration");
    expect(status).toContain("no schema change");
    expect(status).toContain("no data change");
    expect(status).toContain("no runtime change");
  });
});
