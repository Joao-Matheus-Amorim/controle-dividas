import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("bank controlled options contract", () => {
  const options = read("lib/finance/bank-options.ts");
  const form = read("components/finance/bank-account-form.tsx");
  const actions = read("app/protected/bancos/actions.ts");

  it("keeps bank names selected from system-owned options instead of user custom text", () => {
    expect(options).toContain("export const systemBankOptions");
    expect(options).toContain("Revolut");
    expect(options).toContain("Wise");
    expect(options).toContain("Millennium BCP");
    expect(options).toContain("Nubank");
    expect(options).toContain("Banco Inter");
    expect(options).toContain("Dinheiro");
    expect(options).toContain("export function isSystemBankOption");
    expect(options).toContain("export const systemCurrencyOptions");
    expect(options).toContain("export function isSystemCurrencyOption");
    expect(options).toContain("Banco Pan");
    expect(options).toContain("Novo Banco");
    expect(options).toContain("Mercado Pago");

    expect(form).toContain("systemBankOptions.map");
    expect(form).toContain("systemCurrencyOptions.map");
    expect(form).toContain("legacyBankName");
    expect(form).toContain("legacyCurrency");
    expect(form).toContain("(cadastrado)");
    expect(form).toContain("(cadastrada)");
    expect(form).toContain("<select");
    expect(form).toContain('name="bank_name"');
    expect(form).toContain("Selecione um banco");
    expect(form).not.toContain('placeholder="Ex: Revolut, Wise"');
  });

  it("validates controlled bank names on the server action boundary", () => {
    expect(actions).toContain("@/lib/finance/bank-options");
    expect(actions).toContain("isSystemBankOption(input.bankName)");
    expect(actions).toContain("isSystemCurrencyOption(input.currency)");
    expect(actions).toContain("existingBankName && input.bankName === existingBankName");
    expect(actions).toContain("existingCurrency && input.currency === existingCurrency");
    expect(actions).toContain("validateBankAccountInput(input, String(account.bank_name");
    expect(actions).toContain("Selecione um banco da lista do sistema.");
    expect(actions).toContain("Selecione uma moeda da lista do sistema.");
    expect(actions).toContain("bank_name: input.bankName");
  });

  it("keeps controlled bank options unique", async () => {
    const { systemBankOptions } = await import("@/lib/finance/bank-options");

    expect(new Set(systemBankOptions).size).toBe(systemBankOptions.length);
  });
});
