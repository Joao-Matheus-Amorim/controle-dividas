# FamilyFinance - Estrategia de Permissoes e Dashboard

## Visao central

O FamilyFinance e um app financeiro familiar com experiencias diferentes por usuario.

Cada usuario ve apenas os dados vinculados ao seu proprio membro financeiro por padrao. O Admin pode liberar dados, modulos, acoes e funcionalidades extras para qualquer usuario.

Regra principal:

```txt
Role define o padrao inicial.
Admin define a permissao real.
Permissao sempre vence o role.
```

Nenhum usuario deve ver dados de terceiros sem permissao explicita. Essa regra deve valer no frontend, nas server actions, nas queries Supabase e nas regras de RLS.

## Admin

O Admin tem acesso total e controla:

- membros financeiros;
- usuarios familiares;
- vinculo usuario -> membro financeiro;
- limites mensais;
- modulos disponiveis;
- acoes permitidas;
- funcionalidades especificas;
- escopo de dados por usuario;
- relatorios;
- contas fixas;
- contas a pagar;
- contas a receber;
- bancos;
- rendas;
- investimentos futuros;
- graficos e metricas futuras.

## Usuarios familiares

Usuario comum ve somente o proprio financeiro por padrao:

- proprio limite;
- proprios gastos;
- proprias contas vinculadas;
- proprios recebimentos;
- proprios bancos;
- proprias rendas;
- proprios investimentos, quando liberados.

O Admin pode liberar outros modulos ou dados de outras pessoas.

## Perfil infantil ou restrito

Perfil infantil e apenas um preset inicial, nao uma trava permanente.

Exemplo inicial para Caleb:

- ver proprio limite;
- registrar proprio gasto;
- ver proprio historico;
- nao ver dashboard familiar;
- nao ver bancos, contas, relatorios ou investimentos.

Mas o Admin pode liberar qualquer modulo para ele, inclusive bancos, relatorios, investimentos ou dados de outras pessoas.

## Camadas de permissao

A permissao final deve considerar:

```txt
1. Role
2. Modulo
3. Acao
4. Escopo de dados
5. Funcionalidades especificas
```

### Roles

```txt
admin
adult
child
custom
```

Role serve para preset inicial. A permissao configurada pelo Admin e a fonte final da verdade.

### Modulos

```txt
dashboard
people
expenses
fixed_expenses
payable_bills
receivable_incomes
banks
reports
investments
stocks
settings
admin
```

### Acoes

```txt
can_view
can_create
can_edit
can_delete
```

### Escopos

```txt
own      -> apenas o proprio membro financeiro
selected -> membros escolhidos pelo Admin
family   -> toda a familia
```

### Funcionalidades especificas

Exemplos:

```txt
view_own_dashboard
view_family_dashboard
view_own_limit
view_others_limit
create_own_expense
create_expense_for_others
view_banks
view_reports
view_investments
view_admin_shortcut
manage_users
manage_permissions
manage_limits
manage_categories
manage_fixed_expenses
view_stock_charts
view_investment_realtime_prices
```

## Dashboard esperado

O Dashboard sera a central financeira da familia, mas deve respeitar o escopo do usuario.

### Usuario com escopo own

Mostra apenas:

- proprio saldo;
- proprio limite;
- proprios gastos;
- proprias contas;
- proprios bancos;
- proprias rendas;
- proprios investimentos, se liberados.

### Usuario com escopo selected

Mostra dados consolidados apenas das pessoas liberadas pelo Admin.

### Admin ou escopo family

Mostra visao consolidada da familia.

## Blocos futuros do Dashboard

O Dashboard final deve conter:

```txt
1. Visao geral do mes
2. Saude financeira
3. Contas fixas
4. Contas a pagar
5. Contas a receber
6. Gastos por pessoa
7. Gastos por categoria
8. Bancos e saldos
9. Rendas fixas e variaveis
10. Investimentos
11. Acoes e graficos
12. Alertas
13. Projecoes
```

Investimentos e acoes devem ser modulos permissionaveis. Cotacoes e graficos em tempo real devem passar por API/server interno, nunca direto do frontend.

## Modelo de dados recomendado

### user_module_permissions

```txt
id
owner_id
profile_id
module
can_view
can_create
can_edit
can_delete
scope
allowed_member_ids
granted_by
created_at
updated_at
```

### user_feature_permissions

```txt
id
owner_id
profile_id
feature_key
is_enabled
granted_by
created_at
updated_at
```

### fixed_expenses

```txt
id
owner_id
family_member_id
name
category
amount
recurrence
due_day
bank_used
is_active
notes
created_at
updated_at
```

### investments

```txt
id
owner_id
family_member_id
asset_type
ticker
asset_name
quantity
average_price
current_price
invested_amount
current_value
profit_loss
profit_loss_percent
broker
currency
notes
created_at
updated_at
```

### investment_price_history

```txt
id
owner_id
investment_id
ticker
price
variation_day
captured_at
```

### financial_alerts

```txt
id
owner_id
profile_id
type
severity
title
description
related_entity
is_read
created_at
```

## Helpers obrigatorios

Criar no backend:

```txt
getCurrentProfile()
requireAdminProfile()
getModulePermission(profileId, module)
getFeaturePermission(profileId, featureKey)
getAccessibleMemberIds(profileId, module, action)
assertCan(profileId, module, action, targetMemberId)
```

Toda query sensivel deve usar `getAccessibleMemberIds`.

## Regras de UI

1. Menu inferior deve ser dinamico.
2. Modulo sem `can_view` nao aparece.
3. Botoes de criar aparecem apenas com `can_create`.
4. Botoes de editar aparecem apenas com `can_edit`.
5. Botoes de excluir aparecem apenas com `can_delete`.
6. Dashboard muda conforme o escopo.
7. Usuario comum nao ve dados consolidados sem permissao.
8. Admin sempre ve atalho Admin.
9. Criacao deve abrir em modal/sheet quando fizer sentido.
10. Dados sensiveis nunca devem ser renderizados sem permissao.

## Ordem de implementacao

1. Adicionar `scope` e `allowed_member_ids` nas permissoes.
2. Criar `user_feature_permissions`.
3. Criar helpers de permissao.
4. Aplicar filtros nas queries server.
5. Tornar menu dinamico.
6. Ajustar Dashboard para own, selected e family.
7. Evoluir Admin > Permissoes para escopo e membros liberados.
8. Criar contas fixas.
9. Criar alertas.
10. Criar investimentos.
11. Criar cotacoes e graficos.
12. Reforcar RLS no Supabase.

## Regra de ouro

O app deve ser simples para quem usa, mas preciso nas permissoes.

Cada pessoa ve apenas o que precisa. O Admin pode liberar tudo, mas nada deve vazar sem permissao explicita.
