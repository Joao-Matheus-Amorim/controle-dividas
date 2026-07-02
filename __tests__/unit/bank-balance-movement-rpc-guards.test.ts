import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("bank balance movement rpc guards", () => {
  const migration = read("supabase/migrations/059_bank_balance_from_financial_movements.sql");
  const recoveryMigration = read("supabase/migrations/060_idempotent_status_movement_recovery.sql");
  const convertedReceivableMigration = read("supabase/migrations/077_receivable_movement_converted_amount.sql");
  const payableActions = read("app/protected/contas-a-pagar/actions.ts");
  const receivableActions = read("app/protected/contas-a-receber/actions.ts");

  it("updates bank balances in the same RPC that records payable payments", () => {
    expect(migration).toContain("mark_payable_bill_paid_with_movement");
    expect(migration).toContain("for update");
    expect(migration).toContain("insert into public.financial_movements");
    expect(migration).toContain("current_balance = current_balance - target_bill.amount");
  });

  it("updates bank balances in the same RPC that records receivable receipts", () => {
    expect(migration).toContain("mark_receivable_income_received_with_movement");
    expect(migration).toContain("for update");
    expect(migration).toContain("insert into public.financial_movements");
    expect(migration).toContain("current_balance = current_balance + target_income.amount");
  });

  it("records converted receivable movements in the selected bank currency", () => {
    expect(convertedReceivableMigration).toContain("target_movement_amount numeric default null");
    expect(convertedReceivableMigration).toContain("movement_currency <> upper(target_bank.currency)");
    expect(convertedReceivableMigration).toContain("current_balance = current_balance + movement_amount");
    expect(receivableActions).toContain("convertCurrencyAmount");
    expect(receivableActions).toContain("target_movement_amount");
    expect(receivableActions).toContain("target_movement_currency");
  });

  it("revalidates bank pages after movement-backed status changes", () => {
    const payableStatusAction = payableActions.slice(
      payableActions.indexOf("export async function updatePayableBillStatus"),
    );
    const receivableStatusAction = receivableActions.slice(
      receivableActions.indexOf("export async function updateReceivableIncomeStatus"),
    );

    expect(payableStatusAction).toContain('"/protected/bancos"');
    expect(receivableStatusAction).toContain('"/protected/bancos"');
  });

  it("keeps paid and received RPCs idempotent when a movement already exists", () => {
    expect(recoveryMigration).toContain("existing_movement_id uuid");
    expect(recoveryMigration).toContain("payable_bill_id = target_bill.id");
    expect(recoveryMigration).toContain("receivable_income_id = target_income.id");
    expect(recoveryMigration).toContain("if existing_movement_id is not null then");
  });

  it("blocks quick status reversals until movement reversal exists", () => {
    expect(payableActions).toContain('String(bill.status) === "pago" && status !== "pago"');
    expect(receivableActions).toContain('String(income.status) === "recebido" && status !== "recebido"');
  });
});
