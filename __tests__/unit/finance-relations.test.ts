import { describe, expect, it } from "vitest";

import { firstRelation } from "@/lib/finance/relations";

describe("finance relation helpers", () => {
  it("normalizes null relations", () => {
    expect(firstRelation(null)).toBeNull();
  });

  it("keeps single object relations", () => {
    const relation = { id: "member-1", name: "Member 1" };

    expect(firstRelation(relation)).toBe(relation);
  });

  it("normalizes empty array relations", () => {
    expect(firstRelation([])).toBeNull();
  });

  it("uses the first item from array relations", () => {
    const first = { id: "member-1", name: "Member 1" };
    const second = { id: "member-2", name: "Member 2" };

    expect(firstRelation([first, second])).toBe(first);
  });
});
