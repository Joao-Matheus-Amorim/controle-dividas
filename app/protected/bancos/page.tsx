import { ModulePlaceholder } from "@/components/finance/module-placeholder";

export default function BancosPage() {
  return (
    <ModulePlaceholder
      title="Bancos"
      description="Cadastro dos bancos e contas usados por cada membro da familia."
      items={[
        "Cadastrar banco por pessoa",
        "Informar tipo de conta e saldo atual",
        "Controlar moeda em euro",
        "Usar banco nos gastos, contas e recebimentos",
      ]}
    />
  );
}
