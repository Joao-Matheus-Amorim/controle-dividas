import { deleteExpenseCategory } from "@/app/protected/configuracoes/actions";
import { ExpenseCategoryEditDialog } from "@/components/finance/expense-category-edit-dialog";
import { ExpenseCategoryForm } from "@/components/finance/expense-category-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DbExpenseCategory } from "@/lib/finance/server";
import { Trash2 } from "lucide-react";

interface SettingsCategoriesProps {
  categories: DbExpenseCategory[];
}

export function SettingsCategories({ categories }: SettingsCategoriesProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Nova categoria</p>
          <p className="text-xs font-semibold text-[#8b72f8]">formulário</p>
        </div>
        <ExpenseCategoryForm />
      </div>

      <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Categorias</p>
          <p className="text-xs font-semibold text-[#8b72f8]">{categories.length}</p>
        </div>
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">{category.name}</p>
                {category.is_default ? <Badge variant="secondary">padrão</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-white/35">{category.description || "Sem descrição"}</p>
            </div>

            {!category.is_default ? (
              <div className="flex items-center gap-2">
                <ExpenseCategoryEditDialog category={category} />
                <form action={deleteExpenseCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <Button type="submit" variant="outline" size="icon" aria-label="Excluir categoria" className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
