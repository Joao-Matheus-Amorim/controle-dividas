export const FINANCE_MODULES = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "PESSOAS", label: "Pessoas" },
  { key: "GASTOS", label: "Gastos" },
  { key: "CONTAS_FIXAS", label: "Contas fixas" },
  { key: "CONTAS_A_PAGAR", label: "Contas a pagar" },
  { key: "CONTAS_A_RECEBER", label: "Contas a receber" },
  { key: "BANCOS", label: "Bancos" },
  { key: "RENDAS", label: "Rendas" },
  { key: "RELATORIOS", label: "Relatorios" },
  { key: "INVESTIMENTOS", label: "Investimentos" },
  { key: "ACOES", label: "Acoes" },
  { key: "CONFIGURACOES", label: "Configuracoes" },
  { key: "ADMIN", label: "Admin" },
  { key: "DIVIDAS", label: "Dividas" },
  { key: "METAS", label: "Metas" },
] as const;

export type FinanceModuleKey = (typeof FINANCE_MODULES)[number]["key"];

export type PermissionAction = "can_view" | "can_create" | "can_edit" | "can_delete";

export type PermissionScope = "own" | "selected" | "family";

export const PERMISSION_ACTIONS: Array<{ key: PermissionAction; label: string }> = [
  { key: "can_view", label: "Ver" },
  { key: "can_create", label: "Criar" },
  { key: "can_edit", label: "Editar" },
  { key: "can_delete", label: "Excluir" },
];

export const PERMISSION_SCOPES: Array<{ key: PermissionScope; label: string; description: string }> = [
  {
    key: "own",
    label: "Proprio",
    description: "Usuario ve apenas o proprio membro financeiro.",
  },
  {
    key: "selected",
    label: "Selecionados",
    description: "Usuario ve apenas pessoas liberadas pelo Admin.",
  },
  {
    key: "family",
    label: "Familia",
    description: "Usuario ve a familia inteira.",
  },
];

export const FEATURE_PERMISSIONS = [
  { key: "view_own_dashboard", label: "Ver dashboard proprio" },
  { key: "view_family_dashboard", label: "Ver dashboard familiar" },
  { key: "view_own_limit", label: "Ver proprio limite" },
  { key: "view_others_limit", label: "Ver limite de outras pessoas" },
  { key: "create_own_expense", label: "Registrar proprio gasto" },
  { key: "create_expense_for_others", label: "Registrar gasto para outros" },
  { key: "view_banks", label: "Ver bancos" },
  { key: "view_reports", label: "Ver relatorios" },
  { key: "view_investments", label: "Ver investimentos" },
  { key: "view_stock_charts", label: "Ver graficos de acoes" },
  { key: "view_admin_shortcut", label: "Ver atalho Admin" },
  { key: "manage_users", label: "Gerenciar usuarios" },
  { key: "manage_permissions", label: "Gerenciar permissoes" },
  { key: "manage_limits", label: "Gerenciar limites" },
  { key: "manage_categories", label: "Gerenciar categorias" },
  { key: "manage_fixed_expenses", label: "Gerenciar contas fixas" },
] as const;

export type FeaturePermissionKey = (typeof FEATURE_PERMISSIONS)[number]["key"];