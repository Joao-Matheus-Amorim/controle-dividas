export type DashboardInsightTone = "success" | "warning" | "danger" | "info";

export type DashboardInsight = {
  title: string;
  detail: string;
  tone: DashboardInsightTone;
};

export type BuildDashboardInsightsInput = {
  hasCashflowView: boolean;
  positiveProjectedNetFlow: boolean;
  projectedNetFlowLabel: string;
  monthlyFlowLabel: string;
  canExpenses: boolean;
  canPayables: boolean;
  canReceivables: boolean;
  usedPercent: number;
  overdueBillCount: number;
  overdueBillsLabel: string;
  pendingBillCount: number;
  topCategoryName?: string;
  topCategoryTotalLabel?: string;
  receivableOverdueCount: number;
  incompleteSetupCount: number;
};

function pushInsight(insights: DashboardInsight[], insight: DashboardInsight) {
  if (insights.length < 3) {
    insights.push(insight);
  }
}

export function buildDashboardInsights({
  hasCashflowView,
  positiveProjectedNetFlow,
  projectedNetFlowLabel,
  monthlyFlowLabel,
  canExpenses,
  canPayables,
  canReceivables,
  usedPercent,
  overdueBillCount,
  overdueBillsLabel,
  pendingBillCount,
  topCategoryName,
  topCategoryTotalLabel,
  receivableOverdueCount,
  incompleteSetupCount,
}: BuildDashboardInsightsInput): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  if (canPayables && overdueBillCount > 0) {
    pushInsight(insights, {
      title: "Contas atrasadas precisam de atencao",
      detail: `${overdueBillCount} item(ns) em atraso somando ${overdueBillsLabel}.`,
      tone: "danger",
    });
  }

  if (canExpenses && usedPercent >= 90) {
    pushInsight(insights, {
      title: "Limite mensal esta pressionado",
      detail: `${usedPercent.toFixed(0)}% do limite permitido ja foi usado neste periodo.`,
      tone: usedPercent >= 100 ? "danger" : "warning",
    });
  }

  if (hasCashflowView) {
    pushInsight(insights, {
      title: positiveProjectedNetFlow ? "Fluxo projetado com folga" : "Fluxo projetado negativo",
      detail: `${projectedNetFlowLabel} projetado; ${monthlyFlowLabel}.`,
      tone: positiveProjectedNetFlow ? "success" : "warning",
    });
  }

  if (canReceivables && receivableOverdueCount > 0) {
    pushInsight(insights, {
      title: "Recebimentos atrasados",
      detail: `${receivableOverdueCount} entrada(s) previstas ainda nao foram recebidas.`,
      tone: "warning",
    });
  }

  if (canExpenses && topCategoryName && topCategoryTotalLabel) {
    pushInsight(insights, {
      title: "Maior categoria de saida",
      detail: `${topCategoryName} lidera o mes com ${topCategoryTotalLabel}.`,
      tone: "info",
    });
  }

  if (incompleteSetupCount > 0) {
    pushInsight(insights, {
      title: "Base de operacao incompleta",
      detail: `${incompleteSetupCount} etapa(s) de cadastro ainda podem melhorar os insights.`,
      tone: "info",
    });
  }

  if (insights.length === 0) {
    pushInsight(insights, {
      title: "Operacao financeira sem alerta critico",
      detail: pendingBillCount > 0
        ? `${pendingBillCount} conta(s) pendente(s) seguem no radar.`
        : "Nenhuma pendencia critica apareceu nos modulos liberados.",
      tone: "success",
    });
  }

  return insights;
}
