import { ModulePlaceholder } from "@/components/finance/module-placeholder";

export default function ContasAReceberPage() {
  return (
    <ModulePlaceholder
      title="Contas a receber"
      description="Controle das rendas fixas e variaveis previstas para cada pessoa da familia."
      items={[
        "Cadastrar salario, empresa, servicos e mesada",
        "Separar renda fixa e renda variavel",
        "Definir data prevista e banco de recebimento",
        "Marcar status como previsto, recebido ou atrasado",
      ]}
    />
  );
}
