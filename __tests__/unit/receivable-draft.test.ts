import { describe, expect, it } from "vitest";

import { buildReceivableIncomeDraftSuggestion } from "@/lib/finance/receivable-draft";
import type { DbBankAccount, DbReceivableIncomeSource } from "@/lib/finance/types";

const sources = [
  { id: "source-salary", name: "Salario" },
  { id: "source-freelance", name: "Freelance" },
  { id: "source-commission", name: "Comissão" },
  { id: "source-sales", name: "Vendas" },
] as DbReceivableIncomeSource[];

const bankAccounts = [
  { id: "bank-itau", bank_name: "Itau", account_type: "Conta corrente" },
  { id: "bank-wise", bank_name: "Wise", account_type: "Conta" },
] as DbBankAccount[];

describe("receivable income draft suggestion", () => {
  it("builds a received income draft from natural text", () => {
    const draft = buildReceivableIncomeDraftSuggestion(
      "Recebi freelance do cliente X 500 no Itau",
      sources,
      bankAccounts,
      "2026-06-18",
    );

    expect(draft).toMatchObject({
      amount: "500",
      expectedDate: "2026-06-18",
      incomeType: "variavel",
      paymentOrigin: "cliente X",
      receivingBank: "Itau",
      source: "Freelance",
      status: "recebido",
    });
  });

  it("does not treat future receivables as already received when text says receber", () => {
    const draft = buildReceivableIncomeDraftSuggestion(
      "Freelance do cliente X 500 para receber amanha no Itau",
      sources,
      bankAccounts,
      "2026-06-18",
    );

    expect(draft.status).toBe("previsto");
    expect(draft.expectedDate).toBe("2026-06-19");
    expect(draft.receivingBank).toBe("Itau");
  });

  it("keeps date digits out of the drafted amount", () => {
    const draft = buildReceivableIncomeDraftSuggestion(
      "Freelance do cliente X 500 em 20/06 no Itau",
      sources,
      bankAccounts,
      "2026-06-18",
    );

    expect(draft.amount).toBe("500");
    expect(draft.expectedDate).toBe("2026-06-20");
  });

  it("splits payer from commission source in received income text", () => {
    const draft = buildReceivableIncomeDraftSuggestion(
      "recebi 100 euros do Danyel da comissao",
      sources,
      bankAccounts,
      "2026-06-18",
    );

    expect(draft).toMatchObject({
      amount: "100",
      paymentOrigin: "Danyel",
      source: "Comissão",
      status: "recebido",
    });
  });
});
