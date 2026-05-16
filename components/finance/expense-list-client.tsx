"use client";

import { ReceiptText, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { ExpenseForm } from "@/components/finance/expense-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DbExpense, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/server";
import { formatCurrency } from "@/lib/finance/calculations";
import { deleteExpense } from "@/app/protected/gastos/actions";

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
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false);

  return (
    <>
      <div className="space-y-3">
        {expenses.map((expense) => (
          <div key={expense.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f0506e]/10 text-[#f0506e]">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-white">{expense.description}</p>
                <Badge variant="secondary" className="border-white/10 bg-white/10 text-white/60">{expense.expense_categories?.name || "Sem categoria"}</Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-white/35">{expense.family_members?.name || "Pessoa não informada"} · {new Date(`${expense.expense_date}T00:00:00`).toLocaleDateString("pt-BR")}</p>
              <p className="mt-0.5 truncate text-xs text-white/25">{expense.purchase_location || "Local não informado"}{expense.payment_method ? ` · ${expense.payment_method}` : ""}{expense.bank_or_card ? ` · ${expense.bank_or_card}` : ""}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-sm font-bold text-white">{compactCurrency(Number(expense.amount))}</p>
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
                    onClick={() => {
                      setDeletingExpense(expense);
                      setIsDeleteConfirmed(false);
                    }}
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

      <Dialog open={Boolean(editingExpense)} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar gasto</DialogTitle>
            <DialogDescription>
              Atualize pessoa, categoria, valor, data, local, pagamento e observacoes.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            {editingExpense ? (
              <ExpenseForm members={members} categories={categories} expense={editingExpense} mode="edit" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingExpense)} onOpenChange={(open) => {
        if (!open) {
          setDeletingExpense(null);
          setIsDeleteConfirmed(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir gasto</DialogTitle>
            <DialogDescription>
              Esta acao remove o gasto da listagem e atualiza os totais.
            </DialogDescription>
          </DialogHeader>

          {deletingExpense ? (
            <form action={deleteExpense} className="space-y-4 pt-2">
              <input type="hidden" name="id" value={deletingExpense.id} />
              <input type="hidden" name="confirm_delete" value={isDeleteConfirmed ? "confirmado" : ""} />

              <div className="rounded-2xl border border-[#f0506e]/20 bg-[#f0506e]/10 p-4 text-sm text-[#ff8da0]">
                Confirme a exclusao de <strong className="text-white">{deletingExpense.description}</strong>.
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-sm text-white/45">
                <input
                  type="checkbox"
                  checked={isDeleteConfirmed}
                  onChange={(event) => setIsDeleteConfirmed(event.target.checked)}
                  className="mt-1"
                />
                <span>Confirmo que quero excluir este gasto.</span>
              </label>

              <Button
                type="submit"
                disabled={!isDeleteConfirmed}
                className="w-full rounded-2xl bg-[#f0506e] font-bold text-white hover:bg-[#df405f]"
              >
                Excluir gasto
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
