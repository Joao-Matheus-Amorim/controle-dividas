import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("AI finance intake catalog guards", () => {
  const source = read("lib/finance/ai-finance-intake-catalogs.ts");
  const bankForm = read("components/finance/bank-account-form.tsx");

  it("keeps catalog assembly server-only and scoped by create permissions", () => {
    expect(source).toContain('import "server-only"');
    expect(source).toContain('module: "GASTOS"');
    expect(source).toContain('module: "CONTAS_A_PAGAR"');
    expect(source).toContain('module: "CONTAS_A_RECEBER"');
    expect(source).toContain('module: "BANCOS"');
    expect(source).toContain('getAccessibleMemberOptions(config.module, "can_create", orgSlug)');
  });

  it("uses active-organization loaders instead of ad hoc Supabase queries", () => {
    expect(source).toContain("getOrganizationExpenseCategories");
    expect(source).toContain("getOrganizationReceivableIncomeSources");
    expect(source).toContain("getOrganizationBankAccountsForMembers(members, orgSlug)");
    expect(source).toContain("systemBankOptions");
    expect(source).toContain("systemBankAccountTypeOptions");
    expect(source).toContain("systemCurrencyOptions");
    expect(source).not.toContain("createClient");
    expect(source).not.toContain(".from(");
  });

  it("keeps model/provider/runtime out of the catalog helper", () => {
    expect(source).not.toContain("openai");
    expect(source).not.toContain("@ai-sdk");
    expect(source).not.toContain("generateText");
    expect(source).not.toContain("streamText");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("createExpense");
    expect(source).not.toContain("createPayableBill");
    expect(source).not.toContain("createReceivableIncome");
    expect(source).not.toContain("createBankAccount");
  });

  it("keeps bank account type options shared with the bank form", () => {
    expect(bankForm).toContain("systemBankAccountTypeOptions");
    expect(bankForm).toContain("const accountTypes = systemBankAccountTypeOptions");
  });
});
