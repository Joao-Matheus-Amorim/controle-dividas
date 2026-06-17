export const systemBankOptions = [
  "ActivoBank",
  "Banco CTT",
  "Banco do Brasil",
  "Banco Inter",
  "Banco Original",
  "Bankinter",
  "BPI",
  "Bradesco",
  "Caixa Geral de Depositos",
  "CaixaBank",
  "Cartao refeicao",
  "Credito Agricola",
  "Dinheiro",
  "Edenred",
  "Itau",
  "Millennium BCP",
  "Moey",
  "Montepio",
  "N26",
  "Neon",
  "Next",
  "Nomad",
  "Nubank",
  "Openbank",
  "PayPal",
  "PicPay",
  "Pluxee",
  "Revolut",
  "Santander",
  "Sicoob",
  "Sicredi",
  "Sodexo",
  "Unicre",
  "Unibanco",
  "Wise",
] as const;

export type SystemBankOption = (typeof systemBankOptions)[number];

export function isSystemBankOption(value: string): value is SystemBankOption {
  return systemBankOptions.includes(value as SystemBankOption);
}
