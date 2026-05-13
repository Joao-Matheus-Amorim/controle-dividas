import { ModulePlaceholder } from "@/components/finance/module-placeholder";

export default function RelatoriosPage() {
  return (
    <ModulePlaceholder
      title="Relatorios"
      description="Analise mensal por pessoa, categoria, banco, contas, rendas e saldo final."
      items={[
        "Relatorio de gasto total da familia no mes",
        "Relatorio de gasto por pessoa e categoria",
        "Listagem de contas pagas e pendentes",
        "Comparativo mensal e saldo final por pessoa",
      ]}
    />
  );
}
