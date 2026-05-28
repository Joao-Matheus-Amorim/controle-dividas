import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  dashboardSummaryVisualSnapshotFixture,
  dashboardSummaryVisualSnapshotSurface,
  dashboardSummaryVisualSnapshotUpdatePolicy,
  dashboardSummaryVisualSnapshotViewport,
} from "@/__tests__/fixtures/dashboard-summary-visual-snapshot";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("dashboard summary visual snapshot fixture", () => {
  const fixtureSource = read("__tests__/fixtures/dashboard-summary-visual-snapshot.ts");
  const e2eSpec = read("tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts");
  const visualPage = read("tests/e2e/fixtures/dashboard-summary-visual-page.ts");
  const fixtureDoc = read("docs/audits/DASHBOARD_SUMMARY_VISUAL_FIXTURE.md");
  const strategy = read("docs/audits/SELECTIVE_VISUAL_SNAPSHOT_STRATEGY.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("defines the first selective snapshot surface without adding a screenshot", () => {
    expect(dashboardSummaryVisualSnapshotSurface.id).toBe("dashboard-summary-above-fold");
    expect(dashboardSummaryVisualSnapshotSurface.route).toBe("/protected");
    expect(dashboardSummaryVisualSnapshotSurface.includes).toEqual([
      "DashboardHeader",
      "DashboardHeroSummary",
      "DashboardQuickActions",
      "DashboardSummarySection",
    ]);
    expect(dashboardSummaryVisualSnapshotSurface.excludes).toContain("DashboardFamilySummary");
    expect(fixtureDoc).toContain("tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts");
    expect(fixtureDoc).toContain("run_dashboard_summary_visual_snapshot=true");
  });

  it("uses a single deterministic viewport and update policy", () => {
    expect(dashboardSummaryVisualSnapshotViewport).toEqual({
      name: "mobile-initial",
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      colorScheme: "dark",
    });
    expect(dashboardSummaryVisualSnapshotUpdatePolicy.command).toContain(
      "dashboard-summary-visual-snapshot-gated.spec.ts",
    );
    expect(dashboardSummaryVisualSnapshotUpdatePolicy.command).toContain(
      "--update-snapshots",
    );
    expect(dashboardSummaryVisualSnapshotUpdatePolicy.updateRule).toContain(
      "dashboard acima da dobra",
    );
    expect(dashboardSummaryVisualSnapshotUpdatePolicy.rollbackRule).toContain("Reverter");
  });

  it("keeps fixture data local, stable, and free of runtime secrets", () => {
    expect(fixtureSource).not.toContain("process.env");
    expect(fixtureSource).not.toContain("supabase");
    expect(fixtureSource).not.toContain("service_role");
    expect(fixtureSource).not.toContain("secret");
    expect(fixtureSource).not.toContain("new date");
    expect(fixtureSource).not.toContain("date.now");
    expect(fixtureSource).not.toContain("@/lib/");
    expect(fixtureSource).not.toContain("fetch(");
    expect(fixtureSource).not.toContain("r$");
  });

  it("implements the first screenshot as an explicit opt-in gated contract", () => {
    expect(e2eSpec).toContain("run_dashboard_summary_visual_snapshot");
    expect(e2eSpec).toContain("test.skip");
    expect(e2eSpec).toContain("tohavescreenshot");
    expect(e2eSpec).toContain("dashboard-summary-above-fold");
    expect(e2eSpec).not.toContain("auth/login");
    expect(e2eSpec).not.toContain("supabase");
    expect(visualPage).toContain("renderdashboardsummaryvisualfixturepage");
    expect(visualPage).toContain("compactcurrency");
    expect(visualPage).toContain("data-visual-snapshot");
    expect(visualPage).toContain("390px");
    expect(visualPage).not.toContain("intl.numberformat(\"pt-br\"");
    expect(visualPage).not.toContain("brl");
    expect(visualPage).not.toContain("process.env");
    expect(visualPage).not.toContain("fetch(");
  });

  it("captures the real dashboard above-the-fold text and financial states", () => {
    expect(dashboardSummaryVisualSnapshotFixture.header.periodContextLabel).toBe("Maio de 2026");
    expect(dashboardSummaryVisualSnapshotFixture.header.heading).toBe("Visão do mês");
    expect(dashboardSummaryVisualSnapshotFixture.header.canAdmin).toBe(true);
    expect(dashboardSummaryVisualSnapshotFixture.hero.usedPercent).toBe(34);
    expect(dashboardSummaryVisualSnapshotFixture.hero.healthyMonth).toBe(true);
    expect(dashboardSummaryVisualSnapshotFixture.summaryRows.map((row) => row.key)).toEqual([
      "expenses",
      "payables",
      "banks",
      "receivables",
    ]);
    expect(dashboardSummaryVisualSnapshotFixture.summaryRows.map((row) => row.value)).toEqual([
      "177,50 €",
      "909,30 €",
      "4240,00 €",
      "2120,00 €",
    ]);
    expect(dashboardSummaryVisualSnapshotFixture.payables.pendingCount).toBe(3);
  });

  it("keeps GAP-011 docs aligned with fixture-before-snapshot sequencing", () => {
    expect(strategy).toContain("dashboard_summary_visual_fixture.md");
    expect(strategy).toContain("fixture local deterministica definida");
    expect(roadmap).toContain("dashboard_summary_visual_fixture.md");
    expect(roadmap).toContain("fixture deterministica do dashboard summary acima da dobra");
    expect(gapRegister).toContain("dashboard summary deterministic fixture, and gated dashboard summary screenshot");
    expect(gapRegister).toContain("validate the first gated screenshot");
  });
});
