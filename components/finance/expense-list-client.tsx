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
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/finance/calculations";
import type {
  DbExpense,
  DbExpenseCategory,
  DbFamilyMember,
} from "@/lib/finance/types";

const initialDeleteState: ExpenseActionState = {};

function compactCurrency(value: number) {
  return formatCurrency(value).replace("€", "€ ");
}

export function ExpenseListClient({
  expenses,
  members,
  categories,
  canEdit,
  canDelete,
}: {
  expenses: DbExpense[];
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [editingExpense, setEditingExpense] = useState<DbExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<DbExpense | null>(null);
  const [deleteState, setDeleteState] =
    useState<ExpenseActionState>(initialDeleteState);
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

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
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f0506e]/10 text-[#f0506e]">
              <ReceiptText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-white">
                  {expense.description}
                </p>
                <Badge
                  variant="secondary"
                  className="border-white/10 bg-white/10 text-white/60"
                >
                  {expense.expense_categories?.name || "Sem categoria"}
                </Badge>
              </div>

              <p className="mt-0.5 truncate text-xs text-white/35">
                {expense.family_members?.name || "Pessoa não informada"} ·{" "}
                {new Date(`${expense.expense_date}T00:00:00`).toLocaleDateString(
                  "pt-BR",
                )}
              </p>

              <p className="mt-0.5 truncate text-xs text-white/25">
                {expense.purchase_location || "Local não informado"}
                {expense.payment_method ? ` · ${expense.payment_method}` : ""}
                {expense.bank_or_card ? ` · ${expense.bank_or_card}` : ""}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <p className="text-sm font-bold text-white">
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
                    className="h-8 w-8 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
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
                    className="h-8 w-8 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"
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
          className="max-h-[88vh] overflow-y-auto rounded-t-[1.75rem] md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-3/4 md:max-w-md md:rounded-none md:border-l md:border-t-0 md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right"
        >
          <SheetHeader>
            <SheetTitle>Editar gasto</SheetTitle>
            <SheetDescription>
              Atualize pessoa, categoria, valor, data, local, pagamento e
              observacoes.
            </SheetDescription>
          </SheetHeader>

          <div className="pt-2">
            {editingExpense ? (
              <ExpenseForm
                members={members}
                categories={categories}
                expense={editingExpense}
                mode="edit"
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

              <div className="rounded-2xl border border-[#f0506e]/20 bg-[#f0506e]/10 p-4 text-sm text-[#ff8da0]">
                Confirme a exclusao de{" "}
                <strong className="text-white">
                  {deletingExpense.description}
                </strong>
                .
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-sm text-white/45">
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
                className="w-full rounded-2xl bg-[#f0506e] font-bold text-white hover:bg-[#df405f]"
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
