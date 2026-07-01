import {
  classifyAiFinanceIntent,
  normalizeInput,
  type AiFinanceClassifierIntent,
} from "@/lib/finance/ai-finance-intent-classifier";

export type AiCommandType =
  | "create_expense"
  | "create_payable_bill"
  | "create_receivable_income"
  | "create_bank_account"
  | "update_expense"
  | "update_payable_bill"
  | "update_receivable_income"
  | "update_bank_account"
  | "delete_expense"
  | "delete_payable_bill"
  | "delete_receivable_income"
  | "delete_bank_account"
  | "mark_payable_paid"
  | "mark_receivable_received"
  | "query"
  | "help"
  | "refused";

export type AiCommandClassification = {
  type: AiCommandType;
  confidence: "high" | "medium" | "low";
  reason: string;
  matchedTerms: string[];
  reviewOnly: boolean;
};

const domainTerms: Record<string, string[]> = {
  expense: ["gasto", "compra", "despesa", "comprei", "gastei", "mercado", "uber", "restaurante", "paguei"],
  payable: ["conta", "boleto", "fatura", "luz", "agua", "internet", "aluguel", "vencimento", "vence"],
  receivable: ["receber", "recebi", "receita", "renda", "salario", "entrada", "cai", "deposito"],
  bank: ["banco", "conta corrente", "conta digital", "nubank", "itau", "saldo"],
};

const actionTerms: Record<AiCommandType, string[]> = {
  create_expense: ["criar gasto", "novo gasto", "lancar", "adicionar gasto", "registrar gasto"],
  create_payable_bill: ["criar conta", "nova conta", "adicionar conta", "registrar conta"],
  create_receivable_income: ["criar recebimento", "novo recebimento", "registrar recebimento"],
  create_bank_account: ["criar banco", "novo banco", "adicionar banco", "cadastrar banco"],
  update_expense: ["editar gasto", "alterar gasto", "mudar gasto", "modificar gasto", "corrigir gasto"],
  update_payable_bill: ["editar conta", "alterar conta", "mudar conta", "modificar conta"],
  update_receivable_income: ["editar recebimento", "alterar recebimento", "mudar recebimento"],
  update_bank_account: ["editar banco", "alterar banco", "modificar banco"],
  delete_expense: ["excluir gasto", "apagar gasto", "deletar gasto", "remover gasto"],
  delete_payable_bill: ["excluir conta", "apagar conta", "deletar conta", "remover conta"],
  delete_receivable_income: ["excluir recebimento", "apagar recebimento", "deletar recebimento"],
  delete_bank_account: ["excluir banco", "apagar banco", "deletar banco"],
  mark_payable_paid: ["pagar conta", "marcar como pago", "pague", "quitar", "baixar conta"],
  mark_receivable_received: ["receber", "marcar como recebido", "recebi", "entrada confirmada"],
  query: ["quanto", "qual", "quais", "quando", "listar", "mostrar", "resumo", "total"],
  help: ["ajuda", "help", "o que voce faz", "comandos", "pode fazer"],
  refused: [],
};

export function normalize(text: string) {
  return normalizeInput(text);
}

function findWordBoundaryMatches(text: string, terms: string[]): string[] {
  const normalized = normalize(text);
  return terms.filter((term) => {
    const normalizedTerm = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\s)${normalizedTerm}(\\s|$)`).test(normalized);
  });
}

function hasDomainTerm(text: string, domain: string): boolean {
  const terms = domainTerms[domain];
  if (!terms) return false;
  return terms.some((t) => {
    const normalizedTerm = normalize(t);
    const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(normalize(text));
  });
}

function getActionTypeFromDomain(
  baseAction: string,
  text: string,
): AiCommandType | null {
  if (hasDomainTerm(text, "expense")) {
    return baseAction + "_expense" as AiCommandType;
  }
  if (hasDomainTerm(text, "payable")) {
    return baseAction + "_payable_bill" as AiCommandType;
  }
  if (hasDomainTerm(text, "receivable")) {
    return baseAction + "_receivable_income" as AiCommandType;
  }
  if (hasDomainTerm(text, "bank")) {
    return baseAction + "_bank_account" as AiCommandType;
  }
  return null;
}

export function routeAiCommand(text: string): AiCommandClassification {
  const normalized = normalize(text);

  if (!normalized) {
    return {
      type: "refused",
      confidence: "high",
      reason: "Empty input",
      matchedTerms: [],
      reviewOnly: false,
    };
  }

  for (const actionType of Object.keys(actionTerms) as AiCommandType[]) {
    if (actionType === "refused" || actionType === "query" || actionType === "help") continue;
    const matches = findWordBoundaryMatches(text, actionTerms[actionType]);
    if (matches.length > 0) {
      return {
        type: actionType,
        confidence: matches.length >= 2 ? "high" : "medium",
        reason: `Detected command: ${actionType}`,
        matchedTerms: matches,
        reviewOnly: false,
      };
    }
  }

  const updateMatch = findWordBoundaryMatches(text, ["editar", "alterar", "mudar", "modificar", "corrigir", "atualizar"]);
  if (updateMatch.length > 0) {
    const resolved = getActionTypeFromDomain("update", text);
    if (resolved) {
      return {
        type: resolved,
        confidence: "medium",
        reason: `Detected update command: ${resolved}`,
        matchedTerms: updateMatch,
        reviewOnly: false,
      };
    }
  }

  const deleteMatch = findWordBoundaryMatches(text, ["excluir", "apagar", "deletar", "remover"]);
  if (deleteMatch.length > 0) {
    const resolved = getActionTypeFromDomain("delete", text);
    if (resolved) {
      return {
        type: resolved,
        confidence: "medium",
        reason: `Detected delete command: ${resolved}`,
        matchedTerms: deleteMatch,
        reviewOnly: false,
      };
    }
  }

  const queryMatch = findWordBoundaryMatches(text, actionTerms.query);
  if (queryMatch.length > 0) {
    return {
      type: "query",
      confidence: queryMatch.length >= 2 ? "high" : "medium",
      reason: "Detected query",
      matchedTerms: queryMatch,
      reviewOnly: false,
    };
  }

  const payMatch = findWordBoundaryMatches(text, ["pagar", "pague", "quitar", "marcar como pago", "baixar"]);
  if (payMatch.length > 0) {
    return {
      type: "mark_payable_paid",
      confidence: payMatch.length >= 2 ? "high" : "medium",
      reason: "Detected payment action",
      matchedTerms: payMatch,
      reviewOnly: false,
    };
  }

  const receiveMatch = findWordBoundaryMatches(text, ["recebi", "marcar como recebido", "entrada confirmada"]);
  if (receiveMatch.length > 0) {
    return {
      type: "mark_receivable_received",
      confidence: "medium",
      reason: "Detected receive action",
      matchedTerms: receiveMatch,
      reviewOnly: false,
    };
  }

  const helpMatch = findWordBoundaryMatches(text, actionTerms.help);
  if (helpMatch.length > 0) {
    return {
      type: "help",
      confidence: "high",
      reason: "Help requested",
      matchedTerms: helpMatch,
      reviewOnly: false,
    };
  }

  const legacy = classifyAiFinanceIntent(text);
  if (legacy.intent !== "recusa" && legacy.intent !== "pergunta") {
    const map: Record<string, AiCommandType> = {
      gasto: "create_expense",
      conta_a_pagar: "create_payable_bill",
      conta_a_receber: "create_receivable_income",
      banco: "create_bank_account",
    };
    return {
      type: map[legacy.intent] ?? "refused",
      confidence: legacy.confidence,
      reason: `Legacy classification: ${legacy.intent}`,
      matchedTerms: legacy.matchedTerms,
      reviewOnly: false,
    };
  }

  return {
    type: "refused",
    confidence: "low",
    reason: "Could not classify command",
    matchedTerms: [],
    reviewOnly: false,
  };
}
