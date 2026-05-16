import { compactCurrency } from "@/lib/finance/formatting";

export { compactCurrency };

export const automaticRules = [
  "Gastos reduzem automaticamente o saldo mensal da pessoa.",
  "Contas vencidas aparecem como atrasadas no dashboard.",
  "Recebimentos vencidos e não recebidos aparecem como atrasados.",
  "Alterar limite mensal recalcula dashboard, gastos e relatórios.",
  "Categorias padrão ficam protegidas contra exclusão acidental.",
  "Todos os valores usam euro como moeda padrão do sistema.",
];
