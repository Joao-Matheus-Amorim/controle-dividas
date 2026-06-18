import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

describe("financial movement reversal migration guards", () => {
  const migration = read("supabase/migrations/065_financial_movement_reversals.sql");
  const hardeningMigration = read("supabase/migrations/066_harden_financial_movement_reversal_boundary.sql");
  const types = read("lib/finance/types.ts");
  const reports = read("lib/organizations/reports.ts");
  const movementsPage = read("features/protected-pages/movimentacoes-page.tsx");
  const movementActions = read("app/protected/movimentacoes/actions.ts");

  it("adds reversal metadata without deleting ledger rows", () => {
    expect(migration).toContain("add column if not exists reversed_at");
    expect(migration).toContain("add column if not exists reversed_by_profile_id");
    expect(migration).toContain("add column if not exists reversal_reason");
    expect(migration).toContain("create or replace function public.reverse_financial_movement");
    expect(migration).toContain("drop index if exists financial_movements_payable_bill_payment_once_idx");
    expect(migration).toContain("drop index if exists financial_movements_receivable_income_receipt_once_idx");
    expect(migration).toContain("and reversed_at is null");
    expect(migration).toContain("create or replace function public.mark_payable_bill_paid_with_movement");
    expect(migration).toContain("create or replace function public.mark_receivable_income_received_with_movement");
    expect(migration).toContain("movement_type not in");
    expect(migration).toContain("payable_bill_payment");
    expect(migration).toContain("receivable_income_receipt");
    expect(migration).not.toContain("delete from public.financial_movements");
  });

  it("reverses bank balances and source statuses atomically", () => {
    expect(migration).toContain("for update");
    expect(migration).toContain("set status = 'pendente'");
    expect(migration).toContain("current_balance = current_balance + target_movement.amount");
    expect(migration).toContain("set status = 'previsto'");
    expect(migration).toContain("current_balance = current_balance - target_movement.amount");
    expect(migration).toContain("set reversed_at = now()");
    expect(migration).toContain("grant execute on function public.reverse_financial_movement");
  });

  it("blocks direct reversal flag writes and keeps reversal controls inside the rpc", () => {
    expect(hardeningMigration).toContain("revoke update on public.financial_movements from authenticated");
    expect(hardeningMigration).toContain("block_direct_financial_movement_reversal_metadata_writes");
    expect(hardeningMigration).toContain("financial_movements_block_direct_reversal_inserts");
    expect(hardeningMigration).toContain("financial_movements_block_direct_reversal_updates");
    expect(hardeningMigration).toContain("before insert");
    expect(hardeningMigration).toContain("new.reversed_at is not null");
    expect(hardeningMigration).toContain("new.reversed_by_profile_id is not null");
    expect(hardeningMigration).toContain("nullif(trim(new.reversal_reason), '') is not null");
    expect(hardeningMigration).toContain("current_setting('app.allow_financial_movement_reversal_update', true)");
    expect(hardeningMigration).toContain("set_config('app.allow_financial_movement_reversal_update', 'on', true)");
    expect(hardeningMigration).toContain("financial_movement_reversal_attempts");
    expect(hardeningMigration).toContain("attempted_at >= now() - interval '10 minutes'");
    expect(hardeningMigration).toContain("recent_attempt_count >= 5");
    expect(hardeningMigration).toContain("record_audit_event");
    expect(hardeningMigration).toContain("finance.movement.reverse");
    expect(hardeningMigration).toContain("auth_user_id = auth.uid()");
    expect(hardeningMigration).toContain("'can_delete'");
    expect(movementActions).toContain("reverse_financial_movement");
    expect(movementActions).not.toContain("checksensitiveoperationratelimit");
    expect(movementActions).not.toContain("recordauditevent");
  });

  it("keeps read models aware of reversed movements", () => {
    expect(types).toContain("reversed_at: string | null");
    expect(types).toContain("reversal_reason: string | null");
    expect(reports).toContain("!movement.reversed_at");
    expect(movementsPage).toContain("activefilteredmovements");
  });
});
