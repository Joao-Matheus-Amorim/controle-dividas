export type DefaultFamilyMember = {
  name: string;
  role: string;
  monthlyLimit: number;
  currency: "EUR";
};

export type DefaultExpenseCategory = {
  key: string;
  name: string;
  description?: string;
};

export const defaultFamilyMembers: DefaultFamilyMember[] = [
  // People are intentionally not seeded with sample names. They must be created
  // from the real organization's data to avoid leaking demo/persona content.
];

export const defaultExpenseCategories: DefaultExpenseCategory[] = [
  {
    key: "receitas",
    name: "Receitas",
    description: "Entradas como salário, vendas, reembolsos e cashback.",
  },
  {
    key: "moradia",
    name: "Moradia",
    description: "Custos residenciais recorrentes ou pontuais.",
  },
  {
    key: "utilidades",
    name: "Utilidades",
    description: "Contas essenciais de consumo e comunicação.",
  },
  {
    key: "alimentacao",
    name: "Alimentação",
    description: "Compras de mercado, feira e itens de casa.",
  },
  {
    key: "alimentacao-fora",
    name: "Alimentação Fora",
    description: "Restaurantes, delivery, lanches e cafés.",
  },
  {
    key: "transporte",
    name: "Transporte",
    description: "Deslocamento, combustível, pedágio e estacionamento.",
  },
  {
    key: "saude",
    name: "Saúde",
    description: "Farmácia, consultas, exames e convênios.",
  },
  {
    key: "educacao",
    name: "Educação",
    description: "Ensino, cursos, livros e certificações.",
  },
  {
    key: "filhos",
    name: "Filhos",
    description: "Custos infantis, atividades, presentes e lazer.",
  },
  {
    key: "trabalho",
    name: "Trabalho",
    description: "Ferramentas, softwares, equipamentos e infraestrutura.",
  },
  {
    key: "marketing",
    name: "Marketing",
    description: "Anúncios, tráfego pago e divulgação.",
  },
  {
    key: "roupas-e-acessorios",
    name: "Roupas e Acessórios",
    description: "Vestuário, calçados, bolsas e acessórios.",
  },
  {
    key: "lazer-e-entretenimento",
    name: "Lazer e Entretenimento",
    description: "Streaming, cinema, jogos, eventos e assinaturas.",
  },
  {
    key: "viagens",
    name: "Viagens",
    description: "Passagens, hospedagem, alimentação e passeios.",
  },
  {
    key: "igreja-e-doacoes",
    name: "Igreja e Doações",
    description: "Dízimos, ofertas, ações sociais e doações.",
  },
  {
    key: "investimentos",
    name: "Investimentos",
    description: "Aportes e aplicações financeiras.",
  },
  {
    key: "negocios",
    name: "Negócios",
    description: "Estoque, operação, fornecedores e marketing empresarial.",
  },
  {
    key: "documentacao-e-taxas",
    name: "Documentação e Taxas",
    description: "Documentos, certidões, cartórios e taxas governamentais.",
  },
  {
    key: "transferencias",
    name: "Transferências",
    description: "Movimentos entre contas próprias; não entra no relatório de gastos.",
  },
  {
    key: "dividas-e-financiamentos",
    name: "Dívidas e Financiamentos",
    description: "Cartão, empréstimos, financiamentos e parcelamentos.",
  },
];
