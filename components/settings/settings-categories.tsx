import { ExpenseCategoryEditDialog } from "@/components/finance/expense-category-edit-dialog";
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
    <section className="grid gap-4">
      <div className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Categorias de gastos e contas</p>
          <p className="text-xs font-semibold text-primary">{categories.length}</p>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Use as categorias padrao sempre que possivel. Crie uma categoria personalizada so quando nenhuma opcao existente representar o custo.
        </p>
        {categories.map((category) => (
          <div key={category.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background/50 p-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{categoryLabels.get(category.id) ?? category.name}</p>
                {category.is_default ? <Badge variant="secondary">padrao</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-ff-subtle-foreground">{category.description || "Sem descricao"}</p>
              {category.parent_category_id ? (
                <p className="mt-1 text-xs text-ff-subtle-foreground">
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
