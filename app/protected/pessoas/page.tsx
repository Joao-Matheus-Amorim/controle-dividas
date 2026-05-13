import { ModulePlaceholder } from "@/components/finance/module-placeholder";

export default function PessoasPage() {
  return (
    <ModulePlaceholder
      title="Pessoas"
      description="Cadastro dos membros da familia, limites mensais e saldo individual."
      items={[
        "Cadastrar membros da familia",
        "Alterar limite mensal individual",
        "Ativar ou desativar pessoa",
        "Ver gasto total e saldo restante",
      ]}
    />
  );
}
