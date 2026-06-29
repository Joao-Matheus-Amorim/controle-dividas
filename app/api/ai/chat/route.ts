import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/ai/audit";
import { createAiProvider } from "@/lib/ai/provider";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { getCurrentOrganizationProfile } from "@/lib/finance/access-control";
import { classifyAiFinanceIntent, getAiFinanceClassifierIntentLabel, type AiFinanceClassifierIntent } from "@/lib/finance/ai-finance-intent-classifier";
import { buildAiFinanceUniversalDraft } from "@/lib/finance/ai-finance-universal-draft";
import {
  getOrCreateConversation,
  addMessage,
  setConversationIntent,
  markConversationComplete,
} from "@/lib/ai/conversation";

const chatRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  organization_id: z.string().uuid(),
});

const requiredFieldsByIntent: Record<string, string[]> = {
  gasto: ["memberId", "categoryId", "amount", "date", "description"],
  conta_a_pagar: ["memberId", "categoryId", "name", "amount", "dueDate", "status", "billType"],
  conta_a_receber: ["memberId", "sourceId", "amount", "expectedDate", "status", "incomeType"],
  banco: ["memberId", "bankName", "accountType", "currentBalance", "currency"],
};

const friendlyFieldNames: Record<string, string> = {
  memberId: "membro da familia",
  categoryId: "categoria",
  name: "nome da conta",
  amount: "valor",
  date: "data",
  description: "descricao",
  dueDate: "data de vencimento",
  expectedDate: "data prevista",
  status: "status",
  billType: "tipo de conta (fixa/avulsa)",
  incomeType: "tipo de receita",
  sourceId: "origem",
  bankName: "nome do banco",
  accountType: "tipo de conta",
  currentBalance: "saldo atual",
  currency: "moeda",
};

function getMissingFields(intent: string, data: Record<string, unknown>): string[] {
  const fields = requiredFieldsByIntent[intent];
  if (!fields) return [];
  return fields.filter((f) => {
    const v = data[f];
    return v === undefined || v === null || v === "";
  });
}

function getFriendlyNames(fields: string[]): string[] {
  return fields.map((f) => friendlyFieldNames[f] || f);
}

function buildSystemPrompt(
  intent: AiFinanceClassifierIntent,
  collectedData: Record<string, unknown>,
  missingFields: string[],
  isComplete: boolean,
): string {
  const intentLabel = getAiFinanceClassifierIntentLabel(intent);
  const lines: string[] = [
    "Voce e um assistente financeiro do FamilyFinance, um SaaS de controle financeiro pessoal e familiar.",
    "Responda de forma concisa, direta e em portugues brasileiro.",
    "Nao invente dados. Use apenas as informacoes fornecidas pelo usuario.",
    "Nao execute acoes de escrita, criacao, alteracao ou exclusao de dados.",
    "Mantenha o tom profissional e amigavel.",
    "",
    `Intencao do usuario: ${intentLabel}.`,
  ];

  if (intent === "pergunta") {
    lines.push("O usuario fez uma pergunta financeira. Responda com base no contexto fornecido.");
  } else {
    const collected = Object.entries(collectedData)
      .filter(([k]) => k !== "intent" && requiredFieldsByIntent[intent]?.includes(k))
      .map(([k, v]) => `${friendlyFieldNames[k] || k}: ${v}`);

    if (collected.length > 0) {
      lines.push(`Dados ja coletados: ${collected.join(", ")}.`);
    }

    if (missingFields.length > 0) {
      const friendly = getFriendlyNames(missingFields);
      lines.push(`Campos obrigatorios faltantes: ${friendly.join(", ")}.`);
      lines.push("Pergunte ao usuario sobre esses campos de forma natural, um de cada vez.");
    }

    if (isComplete) {
      lines.push("Todos os campos obrigatorios foram preenchidos.");
      lines.push("Apresente um resumo do registro e pergunte se o usuario quer confirmar ou ajustar algo.");
    }
  }

  return lines.join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();

    if (authError || !auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { text, organization_id } = parsed.data;

    const profile = await getCurrentOrganizationProfile();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Inactive or missing profile" }, { status: 403 });
    }

    if (profile.organization_id !== organization_id) {
      return NextResponse.json({ error: "Invalid organization context" }, { status: 403 });
    }

    const classification = classifyAiFinanceIntent(text);

    if (classification.intent === "recusa") {
      await auditLog({
        action: "chat_refusal",
        payload: { text, organization_id },
        result: { reason: classification.reason },
        success: true,
        organization_id,
        created_by: profile.id,
      });

      return NextResponse.json({
        result: {
          content: "Nao posso executar essa acao. O assistente e apenas para consulta e registro de dados financeiros.",
          classification: { intent: classification.intent, confidence: classification.confidence },
        },
      });
    }

    const rateLimitKey = `chat:${organization_id}:${profile.id}`;
    const rateLimitResult = checkRateLimit(rateLimitKey);

    if (!rateLimitResult.allowed) {
      await auditLog({
        action: "chat_completion",
        payload: { text, organization_id, classification: classification.intent },
        result: { error: "rate_limited" },
        success: false,
        organization_id,
        created_by: profile.id,
      });

      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterMs: rateLimitResult.resetInMs },
        { status: 429 },
      );
    }

    const conv = getOrCreateConversation(organization_id, profile.id);

    if (!conv.intent && classification.intent !== "pergunta") {
      setConversationIntent(organization_id, profile.id, classification.intent);
    }

    addMessage(organization_id, profile.id, "user", text);

    const today = new Date().toISOString().slice(0, 10);
    const allUserTexts = conv.messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(". ");

    let draftData: Record<string, unknown> = {};
    let missingFields: string[] = [];
    let isComplete = false;
    let draftReady = false;

    if (classification.intent !== "pergunta") {
      const draftResult = buildAiFinanceUniversalDraft({ text: allUserTexts, today });
      if (
        draftResult.draft &&
        (draftResult.classification.intent === classification.intent ||
          draftResult.classification.intent === conv.intent)
      ) {
        const draft = draftResult.draft as Record<string, unknown>;
        draftData = {};
        for (const [key, value] of Object.entries(draft)) {
          if (value !== undefined && value !== null && value !== "" && key !== "intent") {
            draftData[key] = value;
          }
        }
      }

      const effectiveIntent = conv.intent || classification.intent;
      missingFields = getMissingFields(effectiveIntent, draftData);
      isComplete = missingFields.length === 0;

      if (isComplete) {
        markConversationComplete(organization_id, profile.id);
      }

      draftReady = isComplete || Object.keys(draftData).length >= 2;
    }

    const intentLabel = getAiFinanceClassifierIntentLabel(classification.intent);
    const systemPrompt = buildSystemPrompt(
      classification.intent,
      draftData,
      missingFields,
      isComplete,
    );

    const historyMessages = conv.messages
      .filter((m) => m.role !== "system")
      .slice(-10);

    let provider;
    try {
      provider = createAiProvider();
    } catch {
      const allCollected = Object.entries(draftData)
        .map(([k, v]) => `${friendlyFieldNames[k] || k}: ${v}`)
        .join(", ");

      let fallbackMessage: string;
      if (classification.intent === "pergunta") {
        fallbackMessage = `Detectei ${intentLabel}, mas o assistente de IA nao esta habilitado. Nada foi salvo.`;
      } else if (missingFields.length > 0) {
        const friendly = getFriendlyNames(missingFields);
        fallbackMessage =
          `Detectei ${intentLabel}. Ainda faltam: ${friendly.join(", ")}.` +
          (allCollected ? ` Dados coletados: ${allCollected}.` : "") +
          " Tente incluir mais detalhes.";
      } else {
        fallbackMessage = `Detectei ${intentLabel}. Todos os campos foram preenchidos.` +
          (allCollected ? ` Dados: ${allCollected}.` : "") +
          " Revise no formulario para confirmar.";
      }

      return NextResponse.json({
        result: {
          content: fallbackMessage,
          classification: { intent: classification.intent, confidence: classification.confidence },
          conversationComplete: isComplete,
          draftReady,
          draft: draftData,
        },
      });
    }

    const completion = await provider.complete({
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
      ],
      temperature: 0.5,
      maxTokens: 512,
    });

    addMessage(organization_id, profile.id, "assistant", completion.content);

    if (isComplete) {
      markConversationComplete(organization_id, profile.id);
    }

    await auditLog({
      action: "chat_completion",
      payload: { text, organization_id, classification: classification.intent },
      result: { content: completion.content, model: completion.model, usage: completion.usage },
      success: true,
      organization_id,
      created_by: profile.id,
    });

    return NextResponse.json({
      result: {
        content: completion.content,
        model: completion.model,
        usage: completion.usage,
        classification: { intent: classification.intent, confidence: classification.confidence },
        conversationComplete: isComplete,
        draftReady,
        draft: draftData,
      },
    });
  } catch (err) {
    console.error("[API AI Chat] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
