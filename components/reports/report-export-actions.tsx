import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  DbExpense,
  DbFinancialMovement,
  DbPayableBill,
  DbReceivableIncome,
} from "@/lib/finance/types";
import { movementBankLabel, movementReferenceLabel, movementTitle, movementTypeLabel } from "@/components/movements/movement-utils";

type ReportExportActionsProps = {
  expenses: DbExpense[];
  pendingBills: Array<DbPayableBill & { computed_status: string }>;
  receivedIncomes: Array<DbReceivableIncome & { computed_status: string }>;
  expectedIncomes: Array<DbReceivableIncome & { computed_status: string }>;
  financialMovements: DbFinancialMovement[];
};

function csvCell(value: string | number | null | undefined) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function buildCsv({
  expenses,
  pendingBills,
  receivedIncomes,
  expectedIncomes,
  financialMovements,
}: ReportExportActionsProps) {
  const rows = [
    [
      "tipo",
      "data",
      "descricao",
      "pessoa",
      "categoria_ou_origem",
      "status",
      "banco",
      "direcao",
      "valor",
      "referencia",
    ],
    ...expenses.map((expense) => [
      "gasto",
      expense.expense_date,
      expense.description,
      expense.family_members?.name ?? "",
      expense.expense_categories?.name ?? "",
      "",
      expense.bank_or_card ?? "",
      "saida",
      Number(expense.amount),
      expense.payment_method ?? "",
    ]),
    ...pendingBills.map((bill) => [
      "conta_a_pagar",
      bill.due_date,
      bill.name,
      bill.family_members?.name ?? "",
      bill.category ?? "",
      bill.computed_status,
      bill.bank_used ?? "",
      "saida_prevista",
      Number(bill.amount),
      bill.bill_type,
    ]),
    ...receivedIncomes.map((income) => [
      "conta_a_receber",
      income.expected_date,
      income.source,
      income.family_members?.name ?? "",
      income.payment_origin ?? "",
      income.computed_status,
      income.receiving_bank ?? "",
      "entrada_recebida",
      Number(income.amount),
      income.income_type,
    ]),
    ...expectedIncomes.map((income) => [
      "conta_a_receber",
      income.expected_date,
      income.source,
      income.family_members?.name ?? "",
      income.payment_origin ?? "",
      income.computed_status,
      income.receiving_bank ?? "",
      "entrada_prevista",
      Number(income.amount),
      income.income_type,
    ]),
    ...financialMovements.map((movement) => [
      "movimentacao",
      movement.occurred_at,
      movementTitle(movement),
      movement.family_members?.name ?? "",
      movementTypeLabel(movement),
      "",
      movementBankLabel(movement),
      movement.direction === "inflow" ? "entrada" : "saida",
      Number(movement.amount),
      movementReferenceLabel(movement),
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function ReportExportActions(props: ReportExportActionsProps) {
  const csv = buildCsv(props);
  const href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <Button asChild variant="outline" className="h-10 rounded-xl border-border bg-transparent text-foreground hover:bg-ff-bg-soft hover:text-foreground">
      <a href={href} download="relatorios-familyfinance.csv">
        <Download className="mr-2 h-4 w-4" />
        Exportar CSV
      </a>
    </Button>
  );
}
