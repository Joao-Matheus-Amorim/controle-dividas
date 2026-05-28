import { expect, test } from "@playwright/test";

import {
  dashboardSummaryVisualSnapshotSurface,
  dashboardSummaryVisualSnapshotViewport,
} from "@/__tests__/fixtures/dashboard-summary-visual-snapshot";
import { renderDashboardSummaryVisualFixturePage } from "./fixtures/dashboard-summary-visual-page";

const runDashboardSummaryVisualSnapshot =
  process.env.RUN_DASHBOARD_SUMMARY_VISUAL_SNAPSHOT === "true";
const dashboardSummaryVisualSnapshotTest = runDashboardSummaryVisualSnapshot
  ? test
  : test.skip;
const dashboardSummaryVisualSnapshotFileName = "dashboard-summary-above-fold.png";

test.describe("dashboard summary visual snapshot contract", () => {
  test("is gated by the dedicated visual snapshot flag", () => {
    if (!runDashboardSummaryVisualSnapshot) {
      expect(process.env.RUN_DASHBOARD_SUMMARY_VISUAL_SNAPSHOT).not.toBe("true");
      return;
    }

    expect(runDashboardSummaryVisualSnapshot).toBe(true);
  });

  dashboardSummaryVisualSnapshotTest(
    "captures the deterministic dashboard summary above the fold",
    async ({ page }) => {
      await page.setViewportSize({
        width: dashboardSummaryVisualSnapshotViewport.width,
        height: dashboardSummaryVisualSnapshotViewport.height,
      });
      await page.emulateMedia({
        colorScheme: dashboardSummaryVisualSnapshotViewport.colorScheme,
      });

      await page.setContent(renderDashboardSummaryVisualFixturePage(), {
        waitUntil: "domcontentloaded",
      });

      const snapshotSurface = page.locator(
        `[data-visual-snapshot="${dashboardSummaryVisualSnapshotSurface.id}"]`,
      );

      await expect(snapshotSurface).toBeVisible();
      await expect(snapshotSurface).toHaveScreenshot(
        dashboardSummaryVisualSnapshotFileName,
        {
          animations: "disabled",
          caret: "hide",
        },
      );
    },
  );
});
