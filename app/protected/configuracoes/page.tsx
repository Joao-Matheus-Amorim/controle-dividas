import { ModulePlaceholder } from "@/components/finance/module-placeholder";

export default function ConfiguracoesPage() {
  return (
    <ModulePlaceholder
      title="Configuracoes"
      description="Ajustes gerais do sistema, categorias, limites mensais e regras automaticas."
      items={[
        "Editar categorias de gastos",
        "Alterar limites mensais por pessoa",
        "Configurar moeda padrao em euro",
        "Definir alertas de limite e vencimento",
      ]}
    />
  );
}
