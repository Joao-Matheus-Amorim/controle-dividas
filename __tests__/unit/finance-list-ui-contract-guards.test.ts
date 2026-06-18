import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

function readNormalized(path: string) {
  return readSource(path)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("finance list UI contract guards", () => {
  const contract = readNormalized("docs/audits/FINANCE_LIST_UI_CONTRACT.md");

  it("documents the primary finance list contract without broad redesign or snapshots", () => {
    expect(contract).toContain("gap-011");
    expect(contract).toContain("listas financeiras primarias");
    expect(contract).toContain("estado vazio");
    expect(contract).toContain("canedit");
    expect(contract).toContain("candelete");
    expect(contract).toContain("nao muda a ui");
    expect(contract).toContain("nao");
    expect(contract).toContain("snapshot visual amplo");
    expect(contract).toContain("proxima expansao segura");
    expect(contract).toContain("formularios data-changing");
  });

  it("keeps expenses list split between section shell and client action surface", () => {
    const section = readNormalized("components/expenses/expense-list-section.tsx");
    const client = readSource("components/finance/expense-list-client.tsx");

    expect(section).toContain("gastos cadastrados");
    expect(section).toContain("nenhum gasto cadastrado");
    expect(section).toContain("novo gasto");
    expect(section).toContain("cancreate");
    expect(section).toContain("expenselistclient");
    expect(section).toContain("canedit={canedit}");
    expect(section).toContain("candelete={candelete}");

    expect(client).toContain("canEdit ? (");
    expect(client).toContain("canDelete ? (");
    expect(client).toContain('aria-label="Editar gasto"');
    expect(client).toContain('aria-label="Excluir gasto"');
    expect(client).toContain("<SheetTitle");
    expect(client).toContain("Editar gasto</SheetTitle>");
    expect(client).toContain("DialogTitle>Excluir gasto");
  });

  it("keeps payables list filters, empty states, and gated item actions", () => {
    const list = readNormalized("components/payables/payable-list.tsx");
    const item = readSource("components/payables/payable-list-item.tsx");

    expect(list).toContain("contas e dividas cadastradas");
    expect(list).toContain("itens visiveis no seu escopo");
    expect(list).toContain("payablefilterbar");
    expect(list).toContain("limpar filtros");
    expect(list).toContain("nenhuma conta cadastrada");
    expect(list).toContain("nova conta");
    expect(list).toContain("nenhuma conta neste filtro");
    expect(list).toContain("cancreate");
    expect(list).toContain("getorgpathfromprotectedpath");
    expect(list).toContain("clearfiltershref");
    expect(list).toContain("hasactivefilters");

    expect(item).toContain("canEdit ? (");
    expect(item).toContain("canDelete ? ");
    expect(item).toContain("PayableBillEditDialog");
    expect(item).toContain("PayableBillStatusForm");
    expect(item).toContain("PayableBillDeleteDialog");
  });

  it("keeps receivables list empty state and gated item actions", () => {
    const list = readNormalized("components/receivables/receivable-list.tsx");
    const item = readSource("components/receivables/receivable-list-item.tsx");

    expect(list).toContain("recebimentos");
    expect(list).toContain("nenhum recebimento previsto");
    expect(list).toContain("novo recebimento");
    expect(list).toContain("cancreate");
    expect(list).toContain("receivablelistitem");
    expect(list).toContain("canedit={canedit}");
    expect(list).toContain("candelete={candelete}");

    expect(item).toContain("canEdit ? (");
    expect(item).toContain("canDelete ? ");
    expect(item).toContain("ReceivableIncomeEditDialog");
    expect(item).toContain("ReceivableStatusForm");
    expect(item).toContain("ReceivableDeleteForm");
  });

  it("keeps banks list empty state and gated item actions", () => {
    const list = readNormalized("components/banks/bank-list.tsx");
    const item = readSource("components/banks/bank-list-item.tsx");

    expect(list).toContain("bancos cadastrados");
    expect(list).toContain("nenhum banco cadastrado");
    expect(list).toContain("novo banco");
    expect(list).toContain("cancreate");
    expect(list).toContain("banklistitem");
    expect(list).toContain("canedit={canedit}");
    expect(list).toContain("candelete={candelete}");

    expect(item).toContain("(canEdit || canDelete)");
    expect(item).toContain("canEdit ? (");
    expect(item).toContain("canDelete ? ");
    expect(item).toContain("BankAccountEditDialog");
    expect(item).toContain("BankBalanceForm");
    expect(item).toContain("BankDeleteForm");
    expect(item).toContain("Saldo manual");
    expect(item).toContain("compactCurrencyForCode(Number(account.current_balance), account.currency)");
  });

  it("keeps people list identity, access, status, and edit surfaces explicit", () => {
    const list = readNormalized("components/people/people-list.tsx");
    const item = readSource("components/people/people-list-item.tsx");
    const deleteForm = readSource("components/people/people-delete-form.tsx");
    const actions = readSource("app/protected/pessoas/actions.ts");

    expect(list).toContain("membros cadastrados");
    expect(list).toContain("peoplelistitem");
    expect(list).toContain("profiles.get(member.id)");

    expect(item).toContain("PeopleStatusForm");
    expect(item).toContain("PeopleEditForm");
    expect(item).toContain("PeopleDeleteForm");
    expect(item).toContain("Login ativo");
    expect(item).toContain("Aguardando primeiro acesso");
    expect(item).toContain("Sem acesso");
    expect(item).toContain("Editar pessoa");

    expect(deleteForm).toContain("deleteFamilyMemberWithState");
    expect(deleteForm).toContain('name="confirm_delete"');
    expect(deleteForm).toContain("Excluir pessoa");
    expect(deleteForm).toContain("Desative a pessoa em vez de excluir");
    expect(actions).toContain("export async function deleteFamilyMember");
    expect(actions).toContain("assertFamilyMemberCanBeDeleted");
    expect(actions).toContain("financial_movements");
  });
});
