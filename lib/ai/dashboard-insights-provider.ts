import "server-only";

import { getAiFinanceProviderConfigurationBoundary } from "@/lib/finance/ai-finance-provider-config";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { createAiProvider } from "@/lib/ai/provider";
import {
  buildDashboardInsights,
  type BuildDashboardInsightsInput,
  type DashboardInsight,
  type DashboardInsightTone,
} from "@/lib/finance/dashboard-insights";

export type GenerateDashboardInsightsContext = {
  memberNames: string[];
  categoryNames: string[];
  displayCurrency: string;
  periodLabel: string;
  totalBankBalanceLabel?: string;
};

function buildSystemPrompt(
  input: BuildDashboardInsightsInput,
  ctx: GenerateDashboardInsightsContext,
): string {
  const lines: string[] = [
    "Voce e um analista financeiro do FamilyFinance, um SaaS de controle financeiro pessoal e familiar.",
    "Gere no maximo 3 insights financeiros concisos com base nos dados fornecidos.",
    "Responda SOMENTE com um array JSON valido, sem marcacao, sem texto adicional.",
    'Formato: [{"title": "Titulo curto", "detail": "Frase objetiva ate 100 caracteres", "tone": "success|warning|danger|info"}]',
    "",
    "Regras:",
    "- Maximo 3 insights, ordenados por urgencia (danger > warning > info > success)",
    "- Titulo max 50 caracteres, detail max 100 caracteres",
    "- Seja especifico e baseado nos dados fornecidos",
    "- Use portugues brasileiro natural e direto",
    "- Nao invente nem repita informacoes",
    "",
  ];

  lines.push(`Periodo: ${ctx.periodLabel}.`);
  lines.push(`Moeda: ${ctx.displayCurrency}.`);

  if (ctx.memberNames.length > 0) {
    lines.push(`Membros: ${ctx.memberNames.join(", ")}.`);
  }

  if (ctx.categoryNames.length > 0) {
    lines.push(`Categorias: ${ctx.categoryNames.join(", ")}.`);
  }

  if (ctx.totalBankBalanceLabel) {
    lines.push(`Saldo total em bancos: ${ctx.totalBankBalanceLabel}.`);
  }

  lines.push("");
  lines.push("Dados financeiros do periodo:");

  if (input.canExpenses) {
    if (input.topCategoryName && input.topCategoryTotalLabel) {
      lines.push(`- Maior categoria de gasto: ${input.topCategoryName} (${input.topCategoryTotalLabel}).`);
    }
    lines.push(`- Limite mensal utilizado: ${input.usedPercent.toFixed(0)}%.`);
  }

  if (input.canPayables) {
    lines.push(`- Contas em atraso: ${input.overdueBillCount} (${input.overdueBillsLabel}).`);
    lines.push(`- Contas pendentes: ${input.pendingBillCount}.`);
  }

  if (input.canReceivables) {
    lines.push(`- Recebimentos atrasados: ${input.receivableOverdueCount}.`);
  }

  if (input.hasCashflowView) {
    lines.push(`- Fluxo projetado: ${input.projectedNetFlowLabel}.`);
    lines.push(`- Fluxo ${input.positiveProjectedNetFlow ? "positivo" : "negativo"}.`);
    lines.push(`- ${input.monthlyFlowLabel}.`);
  }

  if (input.incompleteSetupCount > 0) {
    lines.push(`- Etapas de cadastro pendentes: ${input.incompleteSetupCount}.`);
  }

  return lines.join("\n");
}

function parseInsightsResponse(content: string): DashboardInsight[] {
  const jsonMatch = content.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return [];

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    const validTones: DashboardInsightTone[] = ["success", "warning", "danger", "info"];

    const insights = parsed.filter(
      (item): item is Record<string, unknown> =>
        item !== null &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).title === "string" &&
        typeof (item as Record<string, unknown>).detail === "string" &&
        validTones.includes((item as Record<string, unknown>).tone as DashboardInsightTone),
    );

    return insights
      .map((item) => ({
        title: String(item.title).slice(0, 50),
        detail: String(item.detail).slice(0, 120),
        tone: item.tone as DashboardInsightTone,
      }))
      .slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateDashboardInsights(
  input: BuildDashboardInsightsInput,
  ctx: GenerateDashboardInsightsContext,
): Promise<DashboardInsight[]> {
  const fallback = (): DashboardInsight[] => buildDashboardInsights(input);

  try {
    const boundary = getAiFinanceProviderConfigurationBoundary();
    if (!boundary.providerEnabled || !boundary.ready) {
      return fallback();
    }

    const rateLimit = checkRateLimit("dashboard-insights");
    if (!rateLimit.allowed) {
      return fallback();
    }

    const provider = createAiProvider();
    const systemPrompt = buildSystemPrompt(input, ctx);

    const result = await provider.complete({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Gere os insights financeiros." },
      ],
      temperature: 0.3,
      maxTokens: 600,
    });

    const insights = parseInsightsResponse(result.content);
    return insights.length > 0 ? insights : fallback();
  } catch {
    return fallback();
  }
}
