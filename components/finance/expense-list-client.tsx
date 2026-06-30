"use client";

import { ReceiptText, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
  deleteExpense,
  type ExpenseActionState,
} from "@/app/protected/gastos/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { ExpenseForm } from "@/components/finance/expense-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/finance/formatting";
import { buildExpenseCategoryLabelMap } from "@/lib/finance/category-labels";
import type {
  DbExpense,
  DbExpenseCategory,
  DbFamilyMember,
  DbBankAccount,
} from "@/lib/finance/types";

const initialDeleteState: ExpenseActionState = {};

function compactCurrency(value: number) {
  return formatCurrency(value).replace("€", "€ ");
}

export function ExpenseListClient({
  expenses,
  members,
  categories,
  bankAccounts,
  canEdit,
  canDelete,
}: {
  expenses: DbExpense[];
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  bankAccounts: DbBankAccount[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [editingExpense, setEditingExpense] = useState<DbExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<DbExpense | null>(null);
  const [deleteState, setDeleteState] =
    useState<ExpenseActionState>(initialDeleteState);
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const categoryLabels = buildExpenseCategoryLabelMap(categories);

  function resetDeleteDialog() {
    setDeletingExpense(null);
    setDeleteState(initialDeleteState);
    setIsDeleteConfirmed(false);
  }

  function openDeleteDialog(expense: DbExpense) {
    setDeletingExpense(expense);
    setDeleteState(initialDeleteState);
    setIsDeleteConfirmed(false);
  }

  function handleDeleteExpense(formData: FormData) {
    startDeleteTransition(async () => {
      const result = await deleteExpense(formData);
      setDeleteState(result);

      if (result.success) {
        resetDeleteDialog();
      }
    });
  }

  return (
    <>
      <div className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ff-destructive-soft text-ff-destructive">
              <ReceiptText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {expense.description}
                </p>
                <Badge
                  variant="secondary"
                  className="border-border bg-card text-foreground"
                >
                  {expense.category_id
                    ? categoryLabels.get(expense.category_id) ?? expense.expense_categories?.name ?? "Sem categoria"
                    : "Sem categoria"}
                </Badge>
              </div>

              <p className="mt-0.5 truncate text-xs text-ff-subtle-foreground">
                {expense.family_members?.name || "Pessoa não informada"} ·{" "}
                {new Date(`${expense.expense_date}T00:00:00`).toLocaleDateString(
                  "pt-BR",
                )}
              </p>

              <p className="mt-0.5 truncate text-xs text-ff-subtle-foreground">
                {expense.purchase_location || "Local não informado"}
                {expense.payment_method ? ` · ${expense.payment_method}` : ""}
                {expense.bank_or_card ? ` · ${expense.bank_or_card}` : ""}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <p className="text-sm font-bold text-foreground">
                {compactCurrency(Number(expense.amount))}
              </p>

              <div className="flex items-center gap-2">
                {canEdit ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Editar gasto"
                    onClick={() => setEditingExpense(expense)}
                    className="h-8 w-8 rounded-xl border-border bg-transparent text-ff-subtle-foreground hover:bg-ff-bg-soft hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : null}

                {canDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Excluir gasto"
                    onClick={() => openDeleteDialog(expense)}
                    className="h-8 w-8 rounded-xl border-border bg-transparent text-ff-subtle-foreground hover:bg-ff-bg-soft hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Sheet
        open={Boolean(editingExpense)}
        onOpenChange={(open) => !open && setEditingExpense(null)}
      >
        <SheetContent
          side="bottom"
          className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden rounded-none border-x-0 border-b-0 p-0 md:inset-4 md:h-[calc(100dvh-2rem)] md:w-[calc(100vw-2rem)] md:max-w-none md:rounded-3xl md:border md:border-border md:data-[state=closed]:slide-out-to-bottom md:data-[state=open]:slide-in-from-bottom xl:inset-x-8 xl:inset-y-6 xl:h-[calc(100dvh-3rem)] xl:w-[calc(100vw-4rem)]"
        >
          <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 pb-4 pt-5 text-left sm:px-6 lg:px-8">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="min-w-0">
                <SheetTitle className="text-xl lg:text-2xl">Editar gasto</SheetTitle>
                <SheetDescription>
                  Atualize pessoa, categoria, valor, data, local, pagamento e
                  observacoes.
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-[-0.125rem] shrink-0 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-ff-bg-soft hover:text-foreground"
                >
                  Voltar
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 lg:px-8">
            {editingExpense ? (
              <ExpenseForm
                members={members}
                categories={categories}
                bankAccounts={bankAccounts}
                expense={editingExpense}
                mode="edit"
                onSuccess={() => setEditingExpense(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(deletingExpense)}
        onOpenChange={(open) => {
          if (!open) {
            resetDeleteDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir gasto</DialogTitle>
            <DialogDescription>
              Esta acao remove o gasto da listagem e atualiza os totais.
            </DialogDescription>
          </DialogHeader>

          {deletingExpense ? (
            <form action={handleDeleteExpense} className="space-y-4 pt-2">
              <input type="hidden" name="id" value={deletingExpense.id} />
              <input
                type="hidden"
                name="confirm_delete"
                value={isDeleteConfirmed ? "confirmado" : ""}
              />

              <div className="rounded-2xl border border-ff-destructive bg-ff-destructive-soft p-4 text-sm text-ff-destructive">
                Confirme a exclusao de{" "}
                <strong className="text-foreground">
                  {deletingExpense.description}
                </strong>
                .
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background/50 p-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isDeleteConfirmed}
                  onChange={(event) =>
                    setIsDeleteConfirmed(event.target.checked)
                  }
                  className="mt-1"
                />
                <span>Confirmo que quero excluir este gasto.</span>
              </label>

              <AppActionFeedback
                error={deleteState.error}
                success={deleteState.success}
              />

              <Button
                type="submit"
                disabled={!isDeleteConfirmed || isDeleting}
                className="w-full rounded-2xl bg-ff-destructive font-bold text-foreground hover:bg-ff-destructive/90"
              >
                {isDeleting ? "Excluindo..." : "Excluir gasto"}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
