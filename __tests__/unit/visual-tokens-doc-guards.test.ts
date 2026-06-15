import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("visual tokens and component conventions documentation", () => {
  const doc = read("docs/design/VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md");
  const globals = read("app/globals.css");
  const redesign = read("docs/design/redesign-2026-ink-copper-ivory.md");

  it("records the document scope and references the design ADR and redesign issue", () => {
    expect(doc).toContain("issues: #293, #80");
    expect(doc).toContain("docs/adr/0003-design-system-and-shadcn-adoption.md");
    expect(doc).toContain("not a redesign specification");
  });

  it("documents the current token sources", () => {
    expect(doc).toContain("tailwind.config.ts");
    expect(doc).toContain("app/globals.css");
    expect(doc).toContain("components/ui");
    expect(doc).toContain("shadcn");
  });

  it("keeps light mode grounded enough for card and dashboard contrast", () => {
    expect(globals).toContain("--ff-bg: 232 225 213");
    expect(globals).toContain("--ff-bg-soft: 220 210 195");
    expect(globals).toContain("--ff-card: 252 250 246");
    expect(globals).toContain("--ff-border: 191 175 150");
    expect(globals).toContain("--ff-primary: 99 59 24");
    expect(globals).toContain("--ff-primary-foreground: 255 255 255");
    expect(globals).not.toContain("--ff-bg: 250 244 230");
    expect(globals).not.toContain("--ff-border: 229 220 199");
    expect(globals).not.toContain("--ff-primary: 140 87 35");
    expect(redesign).toContain("grounded paper");
    expect(redesign).toContain("#e8e1d5");
    expect(redesign).toContain("#633b18");
  });

  it("documents app visual conventions without changing UI", () => {
    expect(doc).toContain("dark-first");
    expect(doc).toContain("mobile-first");
    expect(doc).toContain("explicit active organization context");
    expect(doc).toContain("current visual baseline, not the final redesign");
    expect(doc).toContain("selective_visual_snapshot_strategy.md");
    expect(doc).toContain("snapshots visuais seletivos");
  });

  it("keeps folder boundaries aligned with ADR 0003", () => {
    expect(doc).toContain("components/ui");
    expect(doc).toContain("no business rules");
    expect(doc).toContain("components/app");
    expect(doc).toContain("components/finance");
    expect(doc).toContain("components/<domain>");
  });

  it("keeps implementation work out of scope", () => {
    expect(doc).toContain("does not:");
    expect(doc).toContain("redesign screens");
    expect(doc).toContain("change components");
    expect(doc).toContain("install dependencies");
    expect(doc).toContain("alter rls");
    expect(doc).toContain("alter migrations");
    expect(doc).toContain("change billing");
    expect(doc).toContain("change business rules");
  });
});
