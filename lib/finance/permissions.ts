export const FINANCE_MODULES = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "PESSOAS", label: "Pessoas" },
  { key: "GASTOS", label: "Gastos" },
  { key: "CONTAS_A_PAGAR", label: "Contas a pagar" },
  { key: "CONTAS_A_RECEBER", label: "Contas a receber" },
  { key: "BANCOS", label: "Bancos" },
  { key: "RELATORIOS", label: "Relatorios" },
  { key: "CONFIGURACOES", label: "Configuracoes" },
  { key: "DIVIDAS", label: "Dividas" },
  { key: "INVESTIMENTOS", label: "Investimentos" },
  { key: "METAS", label: "Metas" },
] as const;

export type FinanceModuleKey = (typeof FINANCE_MODULES)[number]["key"];

export type PermissionAction = "can_view" | "can_create" | "can_edit" | "can_delete";

export const PERMISSION_ACTIONS: Array<{ key: PermissionAction; label: string }> = [
  { key: "can_view", label: "Ver" },
  { key: "can_create", label: "Criar" },
  { key: "can_edit", label: "Editar" },
  { key: "can_delete", label: "Excluir" },
];
