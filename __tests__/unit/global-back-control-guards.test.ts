import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("global back control guards", () => {
  const rootLayout = read("app/layout.tsx");
  const globalBackControl = read("components/app/global-back-control.tsx");

  it("renders the back control from the root layout so every route has an exit", () => {
    expect(rootLayout).toContain("GlobalBackControl");
    expect(rootLayout).toContain("<GlobalBackControl />");
  });

  it("uses browser history first and falls back to a safe route", () => {
    expect(globalBackControl).toContain("window.history.length > 1");
    expect(globalBackControl).toContain("router.back()");
    expect(globalBackControl).toContain("router.push(fallbackForPath(pathname))");
  });
});
