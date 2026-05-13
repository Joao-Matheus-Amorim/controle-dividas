import { ModulePlaceholder } from "@/components/finance/module-placeholder";

export default function ContasAPagarPage() {
  return (
    <ModulePlaceholder
      title="Contas a pagar"
      description="Controle de contas pendentes, pagas e atrasadas com vencimento e responsavel."
      items={[
        "Cadastrar aluguel, escola, internet, energia e agua",
        "Definir valor, vencimento e recorrencia",
        "Marcar status como pago, pendente ou atrasado",
        "Alertar automaticamente contas vencidas",
      ]}
    />
  );
}
