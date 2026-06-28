import { compactCurrency, compactCurrencyForCode } from "@/lib/finance/formatting";
import type { DbFamilyMember } from "@/lib/finance/types";

export { compactCurrency, compactCurrencyForCode };

export const automaticRules = [
  "Gastos reduzem automaticamente o saldo mensal da pessoa.",
  "Contas vencidas aparecem como atrasadas no dashboard.",
  "Recebimentos vencidos e nao recebidos aparecem como atrasados.",
  "Alterar limite mensal recalcula dashboard, gastos e relatorios.",
  "Categorias padrao ficam protegidas contra exclusao acidental.",
  "Cada cadastro respeita a moeda salva no proprio registro.",
];

export function getSettingsCurrencies(members: DbFamilyMember[]) {
  return Array.from(
    new Set(
      members
        .map((member) => String(member.currency ?? "").trim().toUpperCase())
        .filter(Boolean),
    ),
  ).sort();
}

export function getSettingsCurrencyLabel(currencies: string[]) {
  if (currencies.length === 0) {
    return "Nao definida";
  }

  if (currencies.length === 1) {
    return currencies[0];
  }

  return `${currencies.length} moedas`;
}

export function getSettingsCurrencyHelper(currencies: string[]) {
  if (currencies.length <= 1) {
    return undefined;
  }

  return currencies.join(" • ");
}

export function getSettingsTotalLimitLabel(members: DbFamilyMember[]) {
  const currencies = getSettingsCurrencies(members);

  if (members.length === 0) {
    return compactCurrency(0);
  }

  if (currencies.length === 1) {
    const totalLimit = members.reduce(
      (total, member) => total + Number(member.monthly_limit),
      0,
    );

    return compactCurrencyForCode(totalLimit, currencies[0]);
  }

  return "Moedas mistas";
}

export function getSettingsTotalLimitHelper(members: DbFamilyMember[]) {
  const currencies = getSettingsCurrencies(members);

  if (members.length === 0 || currencies.length <= 1) {
    return undefined;
  }

  return `${members.length} limites em ${currencies.length} moedas`;
}
