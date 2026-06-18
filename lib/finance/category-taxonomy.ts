export type FinanceCategoryTaxonomyItem = {
  key: string;
  name: string;
  description: string;
  classificationExamples: string[];
};

export const transferCategoryKey = "transferencias";

export const financeCategoryTaxonomy: FinanceCategoryTaxonomyItem[] = [
  {
    key: "receitas",
    name: "Receitas",
    description: "Entradas como salário, vendas, reembolsos e cashback.",
    classificationExamples: ["Recebi salário", "Venda de roupa usada"],
  },
  {
    key: "moradia",
    name: "Moradia",
    description: "Custos residenciais recorrentes ou pontuais.",
    classificationExamples: ["Paguei aluguel", "Condomínio do apartamento"],
  },
  {
    key: "utilidades",
    name: "Utilidades",
    description: "Contas essenciais de consumo e comunicação.",
    classificationExamples: ["Conta da Enel", "Conta da Light"],
  },
  {
    key: "alimentacao",
    name: "Alimentação",
    description: "Compras de mercado, feira e itens de casa.",
    classificationExamples: ["Comprei 2kg de carne no Carrefour", "Compra no Carrefour"],
  },
  {
    key: "alimentacao-fora",
    name: "Alimentação Fora",
    description: "Restaurantes, delivery, lanches e cafés.",
    classificationExamples: ["McDonald's", "iFood"],
  },
  {
    key: "transporte",
    name: "Transporte",
    description: "Deslocamento, combustível, pedágio e estacionamento.",
    classificationExamples: ["Abasteci o carro", "Uber para o trabalho"],
  },
  {
    key: "saude",
    name: "Saúde",
    description: "Farmácia, consultas, exames e convênios.",
    classificationExamples: ["Comprei remédio", "Consulta médica"],
  },
  {
    key: "educacao",
    name: "Educação",
    description: "Ensino, cursos, livros e certificações.",
    classificationExamples: ["Mensalidade da escola", "Curso online"],
  },
  {
    key: "filhos",
    name: "Filhos",
    description: "Custos infantis, atividades, presentes e lazer.",
    classificationExamples: ["Material escolar do Pedro", "Lazer infantil"],
  },
  {
    key: "trabalho",
    name: "Trabalho",
    description: "Ferramentas, softwares, equipamentos e infraestrutura.",
    classificationExamples: ["Assinatura ChatGPT", "Domínio do site"],
  },
  {
    key: "marketing",
    name: "Marketing",
    description: "Anúncios, tráfego pago e divulgação.",
    classificationExamples: ["Campanha Meta Ads", "Google Ads"],
  },
  {
    key: "roupas-e-acessorios",
    name: "Roupas e Acessórios",
    description: "Vestuário, calçados, bolsas e acessórios.",
    classificationExamples: ["Comprei tênis", "Bolsa nova"],
  },
  {
    key: "lazer-e-entretenimento",
    name: "Lazer e Entretenimento",
    description: "Streaming, cinema, jogos, eventos e assinaturas.",
    classificationExamples: ["Netflix", "Cinema"],
  },
  {
    key: "viagens",
    name: "Viagens",
    description: "Passagens, hospedagem, alimentação e passeios.",
    classificationExamples: ["Hospedagem da viagem", "Passagem aérea"],
  },
  {
    key: "igreja-e-doacoes",
    name: "Igreja e Doações",
    description: "Dízimos, ofertas, ações sociais e doações.",
    classificationExamples: ["Dízimo", "Doação"],
  },
  {
    key: "investimentos",
    name: "Investimentos",
    description: "Aportes e aplicações financeiras.",
    classificationExamples: ["Compra de ações", "Renda fixa"],
  },
  {
    key: "negocios",
    name: "Negócios",
    description: "Estoque, operação, fornecedores e marketing empresarial.",
    classificationExamples: ["Compra de estoque da loja", "Fornecedor"],
  },
  {
    key: "documentacao-e-taxas",
    name: "Documentação e Taxas",
    description: "Documentos, certidões, cartórios e taxas governamentais.",
    classificationExamples: ["Passaporte", "Taxa de cartório"],
  },
  {
    key: transferCategoryKey,
    name: "Transferências",
    description: "Movimentos entre contas próprias; não entra no relatório de gastos.",
    classificationExamples: ["PIX entre contas próprias", "Wise", "Remessa internacional"],
  },
  {
    key: "dividas-e-financiamentos",
    name: "Dívidas e Financiamentos",
    description: "Cartão, empréstimos, financiamentos e parcelamentos.",
    classificationExamples: ["Paguei parcela do empréstimo", "Cartão de crédito"],
  },
];

function normalizeCategoryName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const transferCategoryName = financeCategoryTaxonomy.find(
  (category) => category.key === transferCategoryKey,
)?.name ?? "Transferências";

export function isTransferCategoryName(name: string | null | undefined) {
  return normalizeCategoryName(name ?? "") === normalizeCategoryName(transferCategoryName);
}

export type CategoryAncestryNode = {
  id: string;
  name: string;
  parent_category_id: string | null;
};

export function isTransferCategoryOrDescendant(
  category: CategoryAncestryNode | null | undefined,
  categoriesById: Map<string, CategoryAncestryNode>,
) {
  let currentCategory = category;
  const visitedCategoryIds = new Set<string>();

  while (currentCategory) {
    if (isTransferCategoryName(currentCategory.name)) {
      return true;
    }

    if (!currentCategory.parent_category_id || visitedCategoryIds.has(currentCategory.id)) {
      return false;
    }

    visitedCategoryIds.add(currentCategory.id);
    currentCategory = categoriesById.get(currentCategory.parent_category_id);
  }

  return false;
}
