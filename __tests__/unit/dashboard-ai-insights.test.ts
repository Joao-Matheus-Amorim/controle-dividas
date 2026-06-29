import { describe, expect, it } from "vitest";

import { buildDashboardInsights } from "@/lib/finance/dashboard-insights";

const baseInput = {
  hasCashflowView: true,
  positiveProjectedNetFlow: true,
  projectedNetFlowLabel: "EUR 120",
  monthlyFlowLabel: "EUR 500 de entradas contra EUR 380 de saidas",
  canExpenses: true,
  canPayables: true,
  canReceivables: true,
  usedPercent: 40,
  overdueBillCount: 0,
  overdueBillsLabel: "EUR 0",
  pendingBillCount: 0,
  topCategoryName: "Alimentacao",
  topCategoryTotalLabel: "EUR 90",
  receivableOverdueCount: 0,
  incompleteSetupCount: 0,
};

describe("dashboard AI insights", () => {
  it("prioritizes overdue bills before softer insights", () => {
    const insights = buildDashboardInsights({
      ...baseInput,
      overdueBillCount: 2,
      overdueBillsLabel: "EUR 240",
    });

    expect(insights[0]).toMatchObject({
      title: "Contas atrasadas precisam de atencao",
      tone: "danger",
    });
  });

  it("surfaces over-limit pressure as a danger insight", () => {
    const insights = buildDashboardInsights({
      ...baseInput,
      usedPercent: 101,
    });

    expect(insights.some((insight) => insight.title === "Limite mensal esta pressionado")).toBe(true);
    expect(insights.find((insight) => insight.title === "Limite mensal esta pressionado")?.tone).toBe("danger");
  });

  it("returns a safe success fallback when there are no critical alerts", () => {
    const insights = buildDashboardInsights({
      ...baseInput,
      hasCashflowView: false,
      canExpenses: false,
      topCategoryName: undefined,
      topCategoryTotalLabel: undefined,
    });

    expect(insights).toEqual([
      {
        title: "Operacao financeira sem alerta critico",
        detail: "Nenhuma pendencia critica apareceu nos modulos liberados.",
        tone: "success",
      },
    ]);
  });
});
