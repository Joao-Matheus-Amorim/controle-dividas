import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("security automation guards", () => {
  const dependabot = read(".github/dependabot.yml");
  const codeql = read(".github/workflows/codeql.yml");
  const ci = read(".github/workflows/ci.yml");
  const validation = read("docs/VALIDACAO_TECNICA.md");

  it("keeps dependabot enabled with bounded npm and github actions updates", () => {
    expect(dependabot).toContain('package-ecosystem: "npm"');
    expect(dependabot).toContain('package-ecosystem: "github-actions"');
    expect(dependabot).toContain('target-branch: "main"');
    expect(dependabot).toContain('interval: "weekly"');
    expect(dependabot).toContain("open-pull-requests-limit: 3");
    expect(dependabot).toContain("open-pull-requests-limit: 2");
    expect(dependabot).toContain("ignore:");
    expect(dependabot).toContain('dependency-name: "*"');
    expect(dependabot).toContain('"version-update:semver-major"');
  });

  it("keeps CodeQL scanning JavaScript and TypeScript without deploy coupling", () => {
    expect(codeql).toContain("name: codeql");
    expect(codeql).toContain("security-events: write");
    expect(codeql).toContain("languages: javascript-typescript");
    expect(codeql).toContain("security-extended,security-and-quality");
    expect(codeql).not.toContain("supabase");
    expect(codeql).not.toContain("vercel");
  });

  it("lets Dependabot validate dependency PRs without receiving Supabase secrets", () => {
    expect(ci).toContain("is_dependabot_pr");
    expect(ci).toContain("dependabot[bot]");
    expect(ci).toContain("dependabot-ci-placeholder-public-key");
    expect(ci).toContain("dependabot-ci-placeholder-service-role-key");
    expect(ci).toContain("using non-secret supabase placeholder keys");
  });

  it("documents dependency and CodeQL automation as part of technical validation", () => {
    expect(validation).toContain("dependabot");
    expect(validation).toContain("codeql");
    expect(validation).toContain("open-pull-requests-limit");
    expect(validation).toContain("placeholder");
  });
});
