import { ModulePlaceholder } from "@/components/finance/module-placeholder";

export default function GastosPage() {
  return (
    <ModulePlaceholder
      title="Gastos"
      description="Registro diario de despesas por pessoa, categoria, local, banco e forma de pagamento."
      items={[
        "Registrar pessoa responsavel pelo gasto",
        "Informar data, categoria e descricao",
        "Informar local, valor em euro e forma de pagamento",
        "Descontar automaticamente do limite mensal",
      ]}
    />
  );
}
