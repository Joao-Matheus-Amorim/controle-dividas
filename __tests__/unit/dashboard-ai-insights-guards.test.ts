import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("dashboard AI insights guards", () => {
  const insightsSource = read("lib/finance/dashboard-insights.ts");
  const providerSource = read("lib/ai/dashboard-insights-provider.ts");
  const componentSource = read("components/dashboard/dashboard-ai-insights.tsx");
  const pageSource = read("features/protected-pages/dashboard-page.tsx");
  const roadmap = read("docs/audits/AI_COPILOT_ROADMAP.md").toLowerCase();

  it("keeps the deterministic insights function pure and provider-free", () => {
    expect(insightsSource).toContain("buildDashboardInsights");
    expect(insightsSource).not.toContain("fetch(");
    expect(insightsSource).not.toContain("openai");
    expect(insightsSource).not.toContain("provider");
  });

  it("wraps insights with a provider-enabled fallback layer", () => {
    expect(providerSource).toContain("generateDashboardInsights");
    expect(providerSource).toContain("buildDashboardInsights");
    expect(providerSource).toContain("createAiProvider");
    expect(providerSource).toContain("getAiFinanceProviderConfigurationBoundary");
  });

  it("renders the insights through the dashboard without write actions", () => {
    expect(pageSource).toContain("generateDashboardInsights");
    expect(pageSource).toContain("<DashboardAiInsights insights={dashboardInsights} />");
    expect(componentSource).toContain("Analise contextual do copiloto com IA (fallback deterministico)");
    expect(componentSource).not.toContain("formAction");
    expect(componentSource).not.toContain("type=\"submit\"");
  });

  it("documents AI-06 and AI-12 in the living roadmap", () => {
    expect(roadmap).toContain("ai-06");
    expect(roadmap).toContain("ai-12");
    expect(roadmap).toContain("insights no dashboard");
    expect(roadmap).toContain("lib/finance/dashboard-insights.ts");
  });
});
