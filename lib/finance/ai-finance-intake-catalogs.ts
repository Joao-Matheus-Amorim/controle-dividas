import "server-only";

import {
  systemBankAccountTypeOptions,
  systemBankOptions,
  systemCurrencyOptions,
} from "@/lib/finance/bank-options";
import type {
  AiFinanceCatalogOption,
  AiFinanceIntakeCatalogs,
  AiFinanceIntent,
} from "@/lib/finance/ai-finance-intake-schema";
import { aiFinanceIntents } from "@/lib/finance/ai-finance-intake-schema";
import { getAccessibleMemberOptions } from "@/lib/finance/member-options";
import type { FinanceModuleKey } from "@/lib/finance/permissions";
import type {
  DbBankAccount,
  DbExpenseCategory,
  DbFamilyMember,
  DbReceivableIncomeSource,
} from "@/lib/finance/types";
import { getOrganizationBankAccountsForMembers } from "@/lib/organizations/banks";
import { getOrganizationExpenseCategories } from "@/lib/organizations/categories";
import { getOrganizationReceivableIncomeSources } from "@/lib/organizations/receivable-income-sources";

type AiFinanceCatalogIntentConfig = {
  module: FinanceModuleKey;
  includeExpenseCategories: boolean;
  includeReceivableSources: boolean;
};

const intentCatalogConfig: Record<AiFinanceIntent, AiFinanceCatalogIntentConfig> = {
  gasto: {
    module: "GASTOS",
    includeExpenseCategories: true,
    includeReceivableSources: false,
  },
  conta_a_pagar: {
    module: "CONTAS_A_PAGAR",
    includeExpenseCategories: true,
    includeReceivableSources: false,
  },
  conta_a_receber: {
    module: "CONTAS_A_RECEBER",
    includeExpenseCategories: false,
    includeReceivableSources: true,
  },
  banco: {
    module: "BANCOS",
    includeExpenseCategories: false,
    includeReceivableSources: false,
  },
};

function assertAiFinanceIntent(intent: AiFinanceIntent) {
  if (!aiFinanceIntents.includes(intent)) {
    throw new Error("Unsupported AI finance intake intent.");
  }
}

function toCatalogOption(
  value: Pick<DbFamilyMember | DbExpenseCategory | DbReceivableIncomeSource, "id" | "name">,
): AiFinanceCatalogOption {
  return {
    id: value.id,
    name: value.name,
  };
}

function toBankCatalogOption(account: DbBankAccount) {
  return {
    id: account.id,
    name: account.account_type
      ? `${account.bank_name} - ${account.account_type}`
      : account.bank_name,
    familyMemberId: account.family_member_id,
  };
}

export async function getAiFinanceIntakeCatalogs(
  intent: AiFinanceIntent,
  orgSlug?: string,
): Promise<AiFinanceIntakeCatalogs> {
  assertAiFinanceIntent(intent);

  const config = intentCatalogConfig[intent];
  const members = await getAccessibleMemberOptions(config.module, "can_create", orgSlug);

  const [expenseCategories, receivableSources, bankAccounts] = await Promise.all([
    config.includeExpenseCategories
      ? getOrganizationExpenseCategories(orgSlug)
      : Promise.resolve([]),
    config.includeReceivableSources
      ? getOrganizationReceivableIncomeSources(orgSlug)
      : Promise.resolve([]),
    getOrganizationBankAccountsForMembers(members, orgSlug),
  ]);

  return {
    members: members.map(toCatalogOption),
    expenseCategories: expenseCategories.map(toCatalogOption),
    receivableSources: receivableSources.map(toCatalogOption),
    bankAccounts: bankAccounts.map(toBankCatalogOption),
    bankNames: [...systemBankOptions],
    accountTypes: [...systemBankAccountTypeOptions],
    currencies: [...systemCurrencyOptions],
  };
}
