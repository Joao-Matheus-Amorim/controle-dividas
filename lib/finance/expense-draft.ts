import { financeCategoryTaxonomy } from "@/lib/finance/category-taxonomy";
import {
  cleanFinanceDraftText,
  financeDraftReviewNote,
  findFinanceDraftBankByName,
  normalizeFinanceDraftText,
  parseFinanceDraftDate,
} from "@/lib/finance/finance-draft-utils";
import type { DbBankAccount, DbExpenseCategory } from "@/lib/finance/types";

export type ExpenseDraftSuggestion = {
  amount: string;
  categoryId: string;
  description: string;
  expenseDate: string;
  bankId: string;
  paymentMethod: string;
  purchaseLocation: string;
  notes: string;
};

type CategoryKeywordGroup = {
  key: string;
  keywords: string[];
};

const categoryKeywordGroups: CategoryKeywordGroup[] = [
  { key: "alimentacao-fora", keywords: ["ifood", "restaurante", "mcdonald", "lanche", "delivery", "cafe"] },
  { key: "alimentacao", keywords: ["mercado", "carrefour", "acougue", "hortifruti", "padaria", "carne"] },
  { key: "transporte", keywords: ["uber", "combustivel", "abasteci", "onibus", "trem", "pedagio", "estacionamento"] },
  { key: "saude", keywords: ["farmacia", "remedio", "medico", "dentista", "exame", "convenio"] },
  { key: "educacao", keywords: ["escola", "faculdade", "curso", "livro", "certificacao", "mensalidade"] },
  { key: "filhos", keywords: ["material escolar", "infantil", "pedro", "atividade"] },
  { key: "trabalho", keywords: ["chatgpt", "software", "ferramenta", "hospedagem", "dominio"] },
  { key: "marketing", keywords: ["meta ads", "google ads", "trafego", "campanha"] },
  { key: "lazer-e-entretenimento", keywords: ["netflix", "spotify", "cinema", "jogo", "evento"] },
  { key: "moradia", keywords: ["aluguel", "condominio", "iptu", "seguro residencial"] },
  { key: "utilidades", keywords: ["enel", "light", "luz", "agua", "gas", "internet", "telefone"] },
  { key: "negocios", keywords: ["estoque", "fornecedor", "loja", "operacao"] },
  { key: "transferencias", keywords: ["pix entre contas", "conta propria", "wise", "revolut", "remessa"] },
  { key: "dividas-e-financiamentos", keywords: ["emprestimo", "financiamento", "parcelamento", "cartao de credito"] },
];

const categoryAliasesByKey: Record<string, string[]> = {
  receitas: ["receitas"],
  moradia: ["moradia"],
  utilidades: ["utilidades"],
  alimentacao: ["alimentacao"],
  "alimentacao-fora": ["alimentacao fora"],
  transporte: ["transporte"],
  saude: ["saude"],
  educacao: ["educacao"],
  filhos: ["filhos"],
  trabalho: ["trabalho"],
  marketing: ["marketing"],
  "roupas-e-acessorios": ["roupas e acessorios"],
  "lazer-e-entretenimento": ["lazer e entretenimento"],
  viagens: ["viagens"],
  "igreja-e-doacoes": ["igreja e doacoes"],
  investimentos: ["investimentos"],
  negocios: ["negocios"],
  "documentacao-e-taxas": ["documentacao e taxas"],
  transferencias: ["transferencias"],
  "dividas-e-financiamentos": ["dividas e financiamentos"],
};

function parseDraftAmount(text: string) {
  const amountMatches = Array.from(text.matchAll(/(?:r\$|eur)?\s*(\d{1,6}(?:[.,]\d{1,2})?)/gi));
  const amountMatch = amountMatches[amountMatches.length - 1];

  if (!amountMatch?.[1]) {
    return "";
  }

  return amountMatch[1].replace(",", ".");
}

function parsePaymentMethod(text: string) {
  const normalizedText = normalizeFinanceDraftText(text);

  if (normalizedText.includes("pix")) return "PIX";
  if (normalizedText.includes("cartao")) return "Cartao";
  if (normalizedText.includes("dinheiro")) return "Dinheiro";
  if (normalizedText.includes("transferencia")) return "Transferencia";

  return "";
}

function parsePurchaseLocation(text: string) {
  const locationMatch = text.match(
    /\b(?:no|na|em)\s+([A-Za-z0-9&.' -]+?)(?=\s+(?:por|no|na|com)\s+(?:r\$|eur|\d|cartao|pix|dinheiro|transferencia)|$)/i,
  );
  const rawLocation = locationMatch?.[1]?.trim() ?? "";

  return rawLocation.trim();
}

function findBankAccountId(text: string, bankAccounts: DbBankAccount[]) {
  const normalizedText = normalizeFinanceDraftText(text);
  const mentionsCard = normalizedText.includes("cartao");
  const matchingAccounts = bankAccounts.filter((account) => findFinanceDraftBankByName(text, [account]));

  if (matchingAccounts.length === 0) {
    return bankAccounts.length === 1 ? bankAccounts[0].id : "";
  }

  if (mentionsCard) {
    const cardAccount = matchingAccounts.find((account) => {
      const accountType = normalizeFinanceDraftText(account.account_type ?? "");

      return accountType.includes("cartao") || accountType.includes("credito");
    });

    if (cardAccount) {
      return cardAccount.id;
    }
  }

  return matchingAccounts[0].id;
}

function findCategoryId(text: string, categories: DbExpenseCategory[]) {
  const normalizedText = normalizeFinanceDraftText(text);
  const categoryByName = new Map(
    categories.map((category) => [normalizeFinanceDraftText(category.name), category.id]),
  );
  const categoryByTaxonomyKey = new Map<string, string>();

  for (const taxonomy of financeCategoryTaxonomy) {
    const categoryId =
      categoryByName.get(normalizeFinanceDraftText(taxonomy.name)) ??
      categoryAliasesByKey[taxonomy.key]
        ?.map((alias) => categoryByName.get(normalizeFinanceDraftText(alias)))
        .find((id): id is string => Boolean(id));

    if (categoryId) {
      categoryByTaxonomyKey.set(taxonomy.key, categoryId);
    }
  }

  for (const category of categories) {
    if (normalizedText.includes(normalizeFinanceDraftText(category.name))) {
      return category.id;
    }
  }

  for (const group of categoryKeywordGroups) {
    if (group.keywords.some((keyword) => normalizedText.includes(normalizeFinanceDraftText(keyword)))) {
      return categoryByTaxonomyKey.get(group.key) ?? "";
    }
  }

  for (const taxonomy of financeCategoryTaxonomy) {
    const examples = taxonomy.classificationExamples.map(normalizeFinanceDraftText);
    if (examples.some((example) => normalizedText.includes(example))) {
      return categoryByTaxonomyKey.get(taxonomy.key) ?? "";
    }
  }

  return "";
}

export function buildExpenseDraftSuggestion(
  text: string,
  categories: DbExpenseCategory[],
  bankAccounts: DbBankAccount[],
  today: string,
): ExpenseDraftSuggestion {
  const cleanText = text.trim();

  return {
    amount: parseDraftAmount(cleanText),
    bankId: findBankAccountId(cleanText, bankAccounts),
    categoryId: findCategoryId(cleanText, categories),
    description: cleanFinanceDraftText(cleanText).slice(0, 80),
    expenseDate: parseFinanceDraftDate(cleanText, today),
    paymentMethod: parsePaymentMethod(cleanText),
    purchaseLocation: parsePurchaseLocation(cleanText),
    notes: financeDraftReviewNote,
  };
}
