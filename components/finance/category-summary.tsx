import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/calculations";

export function CategorySummary({
  categories,
}: {
  categories: Array<{ id: string; name: string; total: number }>;
}) {
  const max = Math.max(...categories.map((category) => category.total), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por categoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => {
          const width = (category.total / max) * 100;

          return (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{category.name}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(category.total)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
