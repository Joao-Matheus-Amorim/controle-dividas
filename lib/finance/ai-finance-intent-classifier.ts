import { aiFinanceIntents, type AiFinanceIntent } from "@/lib/finance/ai-finance-intake-schema";

export const aiFinanceClassifierIntents = [
  ...aiFinanceIntents,
  "pergunta",
  "recusa",
] as const;

export type AiFinanceClassifierIntent = (typeof aiFinanceClassifierIntents)[number];

export type AiFinanceIntentClassification = {
  intent: AiFinanceClassifierIntent;
  confidence: "high" | "medium" | "low";
  reason: string;
  matchedTerms: string[];
  reviewOnly: true;
  canAutoSave: false;
  directSaveAction: null;
};

const refusalTerms = [
  "apagar",
  "apague",
  "cancelar",
  "cancele",
  "deletar",
  "delete",
  "editar",
  "edite",
  "excluir",
  "exclua",
  "marcar como pago",
  "pague a conta",
  "salvar automaticamente",
  "transferir dinheiro",
];

const questionTerms = [
  "quanto",
  "qual",
  "quais",
  "quando",
  "listar",
  "liste",
  "me mostra",
  "mostrar",
  "mostre",
  "resumo",
  "tenho que pagar",
  "total",
];

const intentTerms: Record<AiFinanceIntent, string[]> = {
  gasto: [
    "compra",
    "comprei",
    "despesa",
    "gastei",
    "gasto",
    "mercado",
    "paguei",
    "restaurante",
    "uber",
  ],
  conta_a_pagar: [
    "aluguel",
    "boleto",
    "conta a pagar",
    "fatura",
    "internet",
    "luz",
    "para pagar",
    "pagar",
    "vence",
    "vencimento",
  ],
  conta_a_receber: [
    "cliente pagou",
    "conta a receber",
    "entrada",
    "receber",
    "recebi",
    "receita",
    "renda",
    "salario",
    "vai cair",
  ],
  banco: [
    "abrir conta",
    "banco",
    "cadastrar banco",
    "conta corrente",
    "conta digital",
    "itau",
    "nova conta",
    "nubank",
    "saldo inicial",
    "wise",
  ],
};

const labels: Record<AiFinanceClassifierIntent, string> = {
  gasto: "gasto",
  conta_a_pagar: "conta a pagar",
  conta_a_receber: "conta a receber",
  banco: "banco",
  pergunta: "pergunta financeira",
  recusa: "recusa controlada",
};

function normalizeInput(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatches(text: string, terms: readonly string[]) {
  return terms.filter((term) => text.includes(normalizeInput(term)));
}

function buildClassification(
  intent: AiFinanceClassifierIntent,
  matchedTerms: string[],
  reason: string,
): AiFinanceIntentClassification {
  return {
    intent,
    confidence: matchedTerms.length >= 2 ? "high" : matchedTerms.length === 1 ? "medium" : "low",
    reason,
    matchedTerms,
    reviewOnly: true,
    canAutoSave: false,
    directSaveAction: null,
  };
}

export function getAiFinanceClassifierIntentLabel(intent: AiFinanceClassifierIntent) {
  return labels[intent];
}

export function classifyAiFinanceIntent(input: string): AiFinanceIntentClassification {
  const text = normalizeInput(input);

  if (!text) {
    return buildClassification("recusa", [], "Entrada vazia ou sem texto financeiro suficiente.");
  }

  const refusalMatches = findMatches(text, refusalTerms);
  if (refusalMatches.length > 0) {
    return buildClassification(
      "recusa",
      refusalMatches,
      "Pedido parece executar, alterar ou excluir dados; a IA permanece review-only.",
    );
  }

  const questionMatches = findMatches(text, questionTerms);
  const scores = aiFinanceIntents.map((intent) => ({
    intent,
    matches: findMatches(text, intentTerms[intent]),
  }));
  const ranked = [...scores].sort((a, b) => b.matches.length - a.matches.length);
  const [top, second] = ranked;

  if (questionMatches.length > 0 && (!top || top.matches.length <= 1)) {
    return buildClassification(
      "pergunta",
      questionMatches,
      "Texto parece uma pergunta financeira read-only.",
    );
  }

  if (!top || top.matches.length === 0) {
    return buildClassification(
      "recusa",
      [],
      "Nao foi possivel classificar com seguranca em uma intent financeira permitida.",
    );
  }

  if (second && top.matches.length === second.matches.length && second.matches.length > 0) {
    return buildClassification(
      "pergunta",
      [...top.matches, ...second.matches],
      "Texto ficou ambiguo entre intents financeiras e precisa de esclarecimento.",
    );
  }

  return buildClassification(top.intent, top.matches, `Texto classificado como ${labels[top.intent]}.`);
}
