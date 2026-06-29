import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("dashboard AI insights guards", () => {
  const insightsSource = read("lib/finance/dashboard-insights.ts");
  const componentSource = read("components/dashboard/dashboard-ai-insights.tsx");
  const pageSource = read("features/protected-pages/dashboard-page.tsx");
  const roadmap = read("docs/audits/AI_COPILOT_ROADMAP.md").toLowerCase();

  it("keeps dashboard insights deterministic and provider-free", () => {
    expect(insightsSource).toContain("buildDashboardInsights");
    expect(insightsSource).not.toContain("fetch(");
    expect(insightsSource).not.toContain("openai");
    expect(insightsSource).not.toContain("provider");
  });

  it("renders the insights through the dashboard without write actions", () => {
    expect(pageSource).toContain("buildDashboardInsights");
    expect(pageSource).toContain("<DashboardAiInsights insights={dashboardInsights} />");
    expect(componentSource).toContain("Leitura deterministica, sem provider e sem salvamento");
    expect(componentSource).not.toContain("formAction");
    expect(componentSource).not.toContain("type=\"submit\"");
  });

  it("documents AI-06 in the living roadmap", () => {
    expect(roadmap).toContain("ai-06");
    expect(roadmap).toContain("insights no dashboard");
    expect(roadmap).toContain("lib/finance/dashboard-insights.ts");
  });
});
