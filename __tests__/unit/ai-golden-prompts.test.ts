import { describe, it, expect } from "vitest";
import { classifyAiFinanceIntent, type AiFinanceClassifierIntent, type AiFinanceActionType } from "@/lib/finance/ai-finance-intent-classifier";
import { routeAiCommand, type AiCommandType } from "@/lib/ai/manager/intent-router";

type PromptAssertion = {
  input: string;
  desc: string;
  domain: string;
  clIntent?: AiFinanceClassifierIntent;
  clAction?: AiFinanceActionType;
  clConfidence?: string;
  rtType?: AiCommandType;
  rtConfidence?: string;
};

const GOLDEN: PromptAssertion[] = [
  // ═══════════════════ EXPENSE CREATE ═══════════════════
  { input: "paguei mercado 83 no cartao itau ontem", desc: "Expense card itau", domain: "expense",
    clIntent: "gasto", clAction: "criar", clConfidence: "high",
    rtType: "create_expense", rtConfidence: "high" },
  { input: "comprei almoco 25 no credito hoje", desc: "Expense lunch credit", domain: "expense",
    clIntent: "gasto", clAction: "criar", clConfidence: "medium",
    rtType: "create_expense", rtConfidence: "medium" },
  { input: "gastei 150 no posto de gasolina", desc: "Expense gas", domain: "expense",
    clIntent: "gasto", clAction: "criar", clConfidence: "medium",
    rtType: "create_expense", rtConfidence: "medium" },
  { input: "uber 32 reais", desc: "Expense uber", domain: "expense",
    clIntent: "gasto", clAction: "criar", clConfidence: "medium",
    rtType: "create_expense", rtConfidence: "medium" },
  { input: "restaurante 89 euros", desc: "Expense restaurant", domain: "expense",
    clIntent: "gasto", clAction: "criar", clConfidence: "medium",
    rtType: "create_expense", rtConfidence: "medium" },
  { input: "despesa de 200 no supermercado", desc: "Expense supermarket", domain: "expense",
    clIntent: "gasto", clAction: "criar", clConfidence: "high",
    rtType: "create_expense", rtConfidence: "high" },

  // ═══════════════════ EXPENSE EDIT/DELETE ═══════════════════
  { input: "editar gasto do mercado", desc: "Edit expense", domain: "expense",
    clIntent: "gasto", clAction: "editar", clConfidence: "high",
    rtType: "update_expense", rtConfidence: "medium" },
  { input: "alterar o valor do restaurante", desc: "Edit expense value", domain: "expense",
    clIntent: "gasto", clAction: "editar", clConfidence: "medium",
    rtType: "update_expense", rtConfidence: "medium" },
  { input: "excluir gasto do mercado", desc: "Delete expense", domain: "expense",
    clIntent: "gasto", clAction: "excluir", clConfidence: "high",
    rtType: "delete_expense", rtConfidence: "medium" },

  // ═══════════════════ PAYABLE CREATE ═══════════════════
  { input: "boleto da internet vence amanha 120", desc: "Payable internet", domain: "payable",
    clIntent: "conta_a_pagar", clAction: "criar", clConfidence: "high",
    rtType: "create_payable_bill", rtConfidence: "high" },
  { input: "fatura cartao 1500 vence dia 15", desc: "Payable credit card", domain: "payable",
    clIntent: "conta_a_pagar", clAction: "criar", clConfidence: "high",
    rtType: "create_payable_bill", rtConfidence: "high" },
  { input: "aluguel 800 vence dia 5", desc: "Payable rent", domain: "payable",
    clIntent: "conta_a_pagar", clAction: "criar", clConfidence: "high",
    rtType: "create_payable_bill", rtConfidence: "high" },

  // ═══════════════════ PAYABLE EDIT/DELETE ═══════════════════
  { input: "editar conta de luz", desc: "Edit payable", domain: "payable",
    clIntent: "conta_a_pagar", clAction: "editar", clConfidence: "medium",
    rtType: "update_payable_bill", rtConfidence: "medium" },
  { input: "excluir conta de agua", desc: "Delete payable", domain: "payable",
    clIntent: "conta_a_pagar", clAction: "excluir", clConfidence: "medium",
    rtType: "delete_payable_bill", rtConfidence: "medium" },

  // ═══════════════════ PAYMENT (router vs classifier split) ═══════════════════
  { input: "pague a conta de luz", desc: "Pay bill pague a conta", domain: "payable",
    clIntent: "acao_pagamento", clAction: "pagar", clConfidence: "high",
    rtType: "mark_payable_paid", rtConfidence: "medium" },
  { input: "pagar fatura 500", desc: "Pay bill amount", domain: "payable",
    clIntent: "conta_a_pagar", clAction: "criar", clConfidence: "high",
    rtType: "mark_payable_paid", rtConfidence: "medium" },
  { input: "pagar internet 120", desc: "Pay internet (router=pay, cl=create)", domain: "payable",
    clIntent: "conta_a_pagar", clAction: "criar", clConfidence: "high",
    rtType: "mark_payable_paid", rtConfidence: "medium" },
  { input: "pagar conta de luz", desc: "Pagar conta (router=pay, cl=create)", domain: "payable",
    clIntent: "conta_a_pagar", clAction: "criar", clConfidence: "high",
    rtType: "mark_payable_paid", rtConfidence: "medium" },
  { input: "preciso pagar a fatura do cartao", desc: "Preciso pagar fatura", domain: "payable",
    clIntent: "conta_a_pagar", clAction: "criar", clConfidence: "high",
    rtType: "mark_payable_paid", rtConfidence: "medium" },
  { input: "quitar boleto do cartao", desc: "Quitar boleto", domain: "payable",
    clIntent: "conta_a_pagar", clAction: "criar", clConfidence: "medium",
    rtType: "mark_payable_paid", rtConfidence: "medium" },
  { input: "baixar conta de luz", desc: "Baixar conta", domain: "payable",
    clIntent: "conta_a_pagar", clAction: "criar", clConfidence: "medium",
    rtType: "mark_payable_paid", rtConfidence: "medium" },
  { input: "marcar como pago a conta de internet", desc: "Mark as paid (both agree)", domain: "payable",
    clIntent: "acao_pagamento", clAction: "pagar", clConfidence: "medium",
    rtType: "mark_payable_paid", rtConfidence: "medium" },

  // ═══════════════════ RECEIVABLE CREATE ═══════════════════
  { input: "cliente pagou 500 e vai cair amanha", desc: "Receivable generic", domain: "receivable",
    clIntent: "conta_a_receber", clAction: "criar", clConfidence: "high",
    rtType: "create_receivable_income", rtConfidence: "high" },
  { input: "renda extra 200 freelancer", desc: "Receivable freelance", domain: "receivable",
    clIntent: "conta_a_receber", clAction: "criar", clConfidence: "medium",
    rtType: "create_receivable_income", rtConfidence: "medium" },
  { input: "entrada de 1500 deposito", desc: "Receivable deposit", domain: "receivable",
    clIntent: "conta_a_receber", clAction: "criar", clConfidence: "medium",
    rtType: "create_receivable_income", rtConfidence: "medium" },
  { input: "vai cair 800 amanha de freelance", desc: "Receivable tomorrow", domain: "receivable",
    clIntent: "conta_a_receber", clAction: "criar", clConfidence: "medium",
    rtType: "create_receivable_income", rtConfidence: "medium" },

  // ═══════════════════ RECEIVABLE EDIT/DELETE ═══════════════════
  { input: "editar recebimento do salario", desc: "Edit receivable", domain: "receivable",
    clIntent: "conta_a_receber", clAction: "editar", clConfidence: "high",
    rtType: "update_receivable_income", rtConfidence: "medium" },
  { input: "excluir recebimento de 500", desc: "Delete receivable", domain: "receivable",
    clIntent: "conta_a_receber", clAction: "excluir", clConfidence: "medium",
    rtType: "delete_receivable_income", rtConfidence: "medium" },

  // ═══════════════════ MARK RECEIVED ═══════════════════
  { input: "recebi o freelance de 200", desc: "Received freelance", domain: "receivable",
    clIntent: "conta_a_receber", clAction: "criar", clConfidence: "medium",
    rtType: "mark_receivable_received", rtConfidence: "medium" },
  { input: "recebi o pagamento do freelance", desc: "Received payment", domain: "receivable",
    clIntent: "conta_a_receber", clAction: "criar", clConfidence: "medium",
    rtType: "mark_receivable_received", rtConfidence: "medium" },

  // ═══════════════════ BANK ═══════════════════
  { input: "cadastrar banco wise com saldo 20 euros", desc: "Create bank wise", domain: "bank",
    clIntent: "banco", clAction: "criar", clConfidence: "high",
    rtType: "create_bank_account", rtConfidence: "medium" },
  { input: "novo banco nubank conta digital", desc: "Create bank nubank", domain: "bank",
    clIntent: "banco", clAction: "criar", clConfidence: "high",
    rtType: "create_bank_account", rtConfidence: "medium" },
  { input: "editar banco wise", desc: "Edit bank", domain: "bank",
    clIntent: "banco", clAction: "editar", clConfidence: "high",
    rtType: "update_bank_account", rtConfidence: "medium" },
  { input: "excluir banco nubank", desc: "Delete bank", domain: "bank",
    clIntent: "banco", clAction: "excluir", clConfidence: "high",
    rtType: "delete_bank_account", rtConfidence: "medium" },

  // ═══════════════════ QUERY ═══════════════════
  { input: "qual o total de gastos do mes?", desc: "Total expenses", domain: "general",
    clIntent: "pergunta", clAction: "consultar", clConfidence: "high",
    rtType: "query", rtConfidence: "high" },
  { input: "quais contas estao pendentes?", desc: "Pending bills", domain: "general",
    clIntent: "pergunta", clAction: "consultar", clConfidence: "medium",
    rtType: "query", rtConfidence: "medium" },
  { input: "mostrar resumo financeiro", desc: "Financial summary", domain: "general",
    clIntent: "pergunta", clAction: "consultar", clConfidence: "high",
    rtType: "query", rtConfidence: "high" },
  { input: "listar recebimentos do mes", desc: "List receivables", domain: "general",
    clIntent: "pergunta", clAction: "consultar", clConfidence: "medium",
    rtType: "query", rtConfidence: "medium" },
  { input: "quanto tenho que pagar esse mes?", desc: "Quanto pagar (pergunta > pagamento)", domain: "general",
    clIntent: "pergunta", clAction: "consultar", clConfidence: "high",
    rtType: "query", rtConfidence: "medium" },
  { input: "qual o sentido da vida?", desc: "Nonsense question", domain: "general",
    clIntent: "pergunta", clAction: "consultar", clConfidence: "medium",
    rtType: "query", rtConfidence: "medium" },

  // ═══════════════════ HELP ═══════════════════
  { input: "o que voce faz?", desc: "Help general", domain: "general",
    clIntent: "pergunta", clAction: "consultar", clConfidence: "medium",
    rtType: "help", rtConfidence: "high" },
  { input: "ajuda", desc: "Help simple", domain: "general",
    clIntent: "pergunta", clAction: "consultar", clConfidence: "medium",
    rtType: "help", rtConfidence: "high" },
  { input: "comandos", desc: "Help comandos", domain: "general",
    clIntent: "pergunta", clAction: "consultar", clConfidence: "medium",
    rtType: "help", rtConfidence: "high" },

  // ═══════════════════ REFUSED ═══════════════════
  { input: "transferir dinheiro", desc: "Refuse transfer", domain: "general",
    clIntent: "recusa", clAction: "consultar", clConfidence: "medium",
    rtType: "refused", rtConfidence: "low" },
  { input: "salvar automaticamente", desc: "Refuse autosave", domain: "general",
    clIntent: "recusa", clAction: "consultar", clConfidence: "medium",
    rtType: "refused", rtConfidence: "low" },
  { input: "fale sobre financas", desc: "Refuse talk finance", domain: "general",
    clIntent: "recusa", clAction: "consultar", clConfidence: "low",
    rtType: "refused", rtConfidence: "low" },
  { input: "como esta o tempo hoje", desc: "Refuse weather", domain: "general",
    clIntent: "recusa", clAction: "consultar", clConfidence: "low",
    rtType: "refused", rtConfidence: "low" },

  // ═══════════════════ NEGATIVE TESTS ═══════════════════
  { input: "agua mineral 5 reais", desc: "NAO deve ser conta_a_pagar", domain: "negative",
    clIntent: "recusa", clAction: "consultar", clConfidence: "low",
    rtType: "refused", rtConfidence: "low" },
];

// ── CLASSIFIER TESTS ───────────────────────────────────────

describe("classifyAiFinanceIntent — intent", () => {
  for (const p of GOLDEN) {
    it(`[${p.domain}] ${p.desc} → intent: ${p.clIntent}`, () => {
      expect(classifyAiFinanceIntent(p.input).intent).toBe(p.clIntent);
    });
  }
});

describe("classifyAiFinanceIntent — actionType", () => {
  for (const p of GOLDEN) {
    it(`[${p.domain}] ${p.desc} → action: ${p.clAction}`, () => {
      expect(classifyAiFinanceIntent(p.input).actionType).toBe(p.clAction);
    });
  }
});

describe("classifyAiFinanceIntent — confidence", () => {
  for (const p of GOLDEN) {
    it(`[${p.domain}] ${p.desc} → conf: ${p.clConfidence}`, () => {
      expect(classifyAiFinanceIntent(p.input).confidence).toBe(p.clConfidence);
    });
  }
});

// ── ROUTER TESTS ────────────────────────────────────────────

describe("routeAiCommand — type", () => {
  for (const p of GOLDEN) {
    it(`[${p.domain}] ${p.desc} → type: ${p.rtType}`, () => {
      expect(routeAiCommand(p.input).type).toBe(p.rtType);
    });
  }
});

describe("routeAiCommand — confidence", () => {
  for (const p of GOLDEN) {
    it(`[${p.domain}] ${p.desc} → conf: ${p.rtConfidence}`, () => {
      expect(routeAiCommand(p.input).confidence).toBe(p.rtConfidence);
    });
  }
});
