import { ExpenseCategoryEditDialog } from "@/components/finance/expense-category-edit-dialog";
import { ExpenseCategoryForm } from "@/components/finance/expense-category-form";
import { Badge } from "@/components/ui/badge";
import { buildExpenseCategoryLabelMap } from "@/lib/finance/category-labels";
import type { DbExpenseCategory } from "@/lib/finance/types";
import { SettingsCategoryDeleteForm } from "./settings-category-delete-form";

interface SettingsCategoriesProps {
  categories: DbExpenseCategory[];
  canManageCategories?: boolean;
}

export function SettingsCategories({
  categories,
  canManageCategories = false,
}: SettingsCategoriesProps) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const categoryLabels = buildExpenseCategoryLabelMap(categories);

  return (
    <section className={canManageCategories ? "grid gap-4 xl:grid-cols-[0.9fr_1.1fr]" : "grid gap-4"}>
      {canManageCategories ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Nova categoria de custo</p>
            <p className="text-xs font-semibold text-[#8b72f8]">formulario</p>
          </div>
          <ExpenseCategoryForm categories={categories} />
        </div>
      ) : null}

      <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Categorias de gastos e contas</p>
          <p className="text-xs font-semibold text-[#8b72f8]">{categories.length}</p>
        </div>
        {categories.map((category) => (
          <div key={category.id} className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">{categoryLabels.get(category.id) ?? category.name}</p>
                {category.is_default ? <Badge variant="secondary">padrao</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-white/35">{category.description || "Sem descricao"}</p>
              {category.parent_category_id ? (
                <p className="mt-1 text-xs text-white/25">
                  Subcategoria de {categoriesById.get(category.parent_category_id)?.name ?? "categoria removida"}
                </p>
              ) : null}
            </div>

            {!category.is_default && canManageCategories ? (
              <div className="flex items-start gap-2">
                <ExpenseCategoryEditDialog category={category} categories={categories} />
                <SettingsCategoryDeleteForm categoryId={category.id} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
