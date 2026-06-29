import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { checkAiAction } from "@/lib/ai/guard";
import { auditLog } from "@/lib/ai/audit";
import { createAiProvider } from "@/lib/ai/provider";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { getCurrentOrganizationProfile } from "@/lib/finance/access-control";
import { classifyAiFinanceIntent, getAiFinanceClassifierIntentLabel } from "@/lib/finance/ai-finance-intent-classifier";

const chatRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  organization_id: z.string().uuid(),
});

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
        {
          error: "Rate limit exceeded",
          retryAfterMs: rateLimitResult.resetInMs,
        },
        { status: 429 },
      );
    }

    const systemPrompt = [
      "Voce e um assistente financeiro do FamilyFinance, um SaaS de controle financeiro pessoal e familiar.",
      "Responda de forma concisa, direta e em portugues brasileiro.",
      "Nao invente dados. Use apenas as informacoes fornecidas no contexto.",
      "Nao execute acoes de escrita, criacao, alteracao ou exclusao de dados.",
      "Se nao souber a resposta, diga que nao tem informacao suficiente.",
      "Nao peca dados pessoais, senhas ou chaves de API.",
      "Mantenha o tom profissional e amigavel.",
    ].join(" ");

    const intentLabel = getAiFinanceClassifierIntentLabel(classification.intent);
    const userPrompt = [
      `Classificacao da intencao: ${intentLabel} (confianca: ${classification.confidence}).`,
      `Pergunta do usuario: ${text}`,
    ].join("\n");

    let provider;
    try {
      provider = createAiProvider();
    } catch {
      return NextResponse.json(
        {
          result: {
            content: `Detectei ${intentLabel}, mas o assistente de IA nao esta habilitado. Nada foi salvo.`,
            classification: {
              intent: classification.intent,
              confidence: classification.confidence,
            },
          },
        },
      );
    }

    const completion = await provider.complete({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      maxTokens: 512,
    });

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
        classification: {
          intent: classification.intent,
          confidence: classification.confidence,
        },
      },
    });
  } catch (err) {
    console.error("[API AI Chat] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
