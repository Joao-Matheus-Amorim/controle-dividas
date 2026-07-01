import { aiFinanceIntents, type AiFinanceIntent } from "@/lib/finance/ai-finance-intake-schema";

export const aiFinanceClassifierIntents = [
  ...aiFinanceIntents,
  "acao_pagamento",
  "pergunta",
  "recusa",
] as const;

export type AiFinanceClassifierIntent = (typeof aiFinanceClassifierIntents)[number];

export const AI_ACTION_TYPES = ["criar", "editar", "excluir", "pagar", "consultar"] as const;
export type AiFinanceActionType = (typeof AI_ACTION_TYPES)[number];

export type AiFinanceIntentClassification = {
  intent: AiFinanceClassifierIntent;
  actionType: AiFinanceActionType;
  confidence: "high" | "medium" | "low";
  reason: string;
  matchedTerms: string[];
  reviewOnly: true;
  canAutoSave: false;
  directSaveAction: null;
};

const refusalTerms = [
  "salvar automaticamente",
  "transferir dinheiro",
];

const questionTerms = [
  "ajuda",
  "comandos",
  "como funciona",
  "help",
  "listar",
  "liste",
  "me mostra",
  "mostrar",
  "mostre",
  "o que voce",
  "quais",
  "qual",
  "quando",
  "quanto",
  "resumo",
  "tenho que pagar",
  "total",
];

const actionTerms = [
  "marca",
  "marcar como pago",
  "marque",
  "paga a conta",
  "pague a conta",
  "pague",
];

const editTerms: Record<string, string[]> = {
  gasto: ["editar gasto", "edite gasto", "alterar gasto", "mudar gasto", "modificar gasto", "atualizar gasto"],
  conta_a_pagar: ["editar conta", "edite conta", "alterar conta", "mudar conta", "modificar conta", "atualizar conta"],
  conta_a_receber: ["editar recebimento", "edite recebimento", "alterar recebimento", "mudar recebimento"],
  banco: ["editar banco", "edite banco", "alterar banco", "mudar banco", "modificar banco"],
};

const generalEditTerms = ["editar", "edite", "alterar", "altera", "mudar", "mude", "modificar", "modifique", "atualizar", "atualize"];

const deleteTerms: Record<string, string[]> = {
  gasto: ["excluir gasto", "exclua gasto", "apagar gasto", "apague gasto", "deletar gasto", "remover gasto"],
  conta_a_pagar: ["excluir conta", "exclua conta", "apagar conta", "apague conta", "cancelar conta", "cancele conta", "deletar conta", "remover conta"],
  conta_a_receber: ["excluir recebimento", "exclua recebimento", "apagar recebimento", "cancelar recebimento"],
  banco: ["excluir banco", "exclua banco", "apagar banco", "apague banco", "deletar banco", "remover banco"],
};

const generalDeleteTerms = ["excluir", "exclua", "apagar", "apague", "deletar", "delete", "remover", "remova", "cancelar", "cancele"];

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
    "conta de agua",
    "conta de gas",
    "condominio",
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
  acao_pagamento: "acao de pagamento",
  pergunta: "pergunta financeira",
  recusa: "recusa controlada",
};

export function normalizeInput(input: string) {
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

function findWordBoundaryMatches(text: string, terms: readonly string[]) {
  const normalized = normalizeInput(text);
  return terms.filter((term) => {
    const normalizedTerm = normalizeInput(term);
    const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(normalized);
  });
}

function detectActionType(
  text: string,
  intent: AiFinanceIntent,
  actionMatches: string[],
  questionMatches: string[],
): AiFinanceActionType {
  if (actionMatches.length > 0) return "pagar";
  if (questionMatches.length > 0) return "consultar";

  const domainEditMatch = findWordBoundaryMatches(text, editTerms[intent] ?? []);
  if (domainEditMatch.length > 0) return "editar";

  const domainDeleteMatch = findWordBoundaryMatches(text, deleteTerms[intent] ?? []);
  if (domainDeleteMatch.length > 0) return "excluir";

  if (findWordBoundaryMatches(text, generalEditTerms).length > 0) return "editar";
  if (findWordBoundaryMatches(text, generalDeleteTerms).length > 0) return "excluir";

  return "criar";
}

function buildClassification(
  intent: AiFinanceClassifierIntent,
  matchedTerms: string[],
  reason: string,
  actionTypeOverride?: AiFinanceActionType,
): AiFinanceIntentClassification {
  const actionType = actionTypeOverride ?? "criar";
  return {
    intent,
    actionType,
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
    return buildClassification("recusa", [], "Entrada vazia ou sem texto financeiro suficiente.", "consultar");
  }

  const refusalMatches = findMatches(text, refusalTerms);
  if (refusalMatches.length > 0) {
    return buildClassification(
      "recusa",
      refusalMatches,
      "Pedido nao permitido para assistente financeiro.",
      "consultar",
    );
  }

  const actionMatches = findWordBoundaryMatches(text, actionTerms);
  if (actionMatches.length > 0) {
    return buildClassification(
      "acao_pagamento",
      actionMatches,
      "Texto parece ser uma acao de pagamento assistida.",
      "pagar",
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
      "consultar",
    );
  }

  if (!top || top.matches.length === 0) {
    return buildClassification(
      "recusa",
      [],
      "Nao foi possivel classificar com seguranca em uma intent financeira permitida.",
      "consultar",
    );
  }

  if (second && top.matches.length === second.matches.length && second.matches.length > 0) {
    return buildClassification(
      "pergunta",
      [...top.matches, ...second.matches],
      "Texto ficou ambiguo entre intents financeiras e precisa de esclarecimento.",
      "consultar",
    );
  }

  const actionType = detectActionType(text, top.intent, actionMatches, questionMatches);
  return buildClassification(top.intent, top.matches, `Texto classificado como ${labels[top.intent]}. Acao: ${actionType}.`, actionType);
}
