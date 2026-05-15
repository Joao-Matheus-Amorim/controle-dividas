# FamilyFinance - Admin Familiar e Permissoes

## Decisao de escopo

O sistema tera Admin familiar com poder total sobre dados, modulos, funcionalidades e escopos de acesso.

O Admin nao sera um administrador de SaaS comercial. Ele sera o responsavel principal da familia e controlara o que cada usuario familiar pode ver, criar, editar, excluir e acessar.

## Regra oficial

```txt
Role define o padrao inicial.
Admin define a permissao real.
Permissao sempre vence o role.
```

Isso significa que um perfil infantil pode nascer restrito, mas o Admin pode liberar qualquer modulo ou funcionalidade para ele se quiser.

## Objetivo do Admin

Garantir que cada membro da familia tenha acesso apenas ao necessario para sua rotina financeira, sem impedir que o Admin libere acessos amplos quando fizer sentido.

## Papeis

### Admin familiar

Pode:

- ver dashboard consolidado;
- criar usuarios familiares;
- criar membros financeiros;
- vincular usuario a membro financeiro;
- editar limites mensais;
- gerenciar categorias;
- gerenciar bancos;
- configurar permissoes;
- configurar escopo de dados;
- liberar funcionalidades especificas;
- ver relatorios;
- editar ou excluir registros conforme necessario;
- liberar modulos futuros como investimentos e acoes;
- acompanhar alertas e metricas globais.

### Usuario familiar

Pode executar apenas o que o Admin permitir.

Por padrao, ve apenas seus proprios dados financeiros.

Exemplos:

- ver apenas seu proprio dashboard;
- lancar gastos proprios;
- ver contas autorizadas;
- editar apenas seus lancamentos, se liberado;
- ver bancos autorizados;
- ver investimentos autorizados;
- nao excluir dados sensiveis, salvo permissao explicita.

### Perfil infantil ou restrito

Perfil infantil e apenas um preset inicial.

Exemplo:

- Caleb pode ver o proprio limite;
- Caleb pode lancar seus proprios gastos;
- Caleb pode ver seu historico;
- Caleb nao ve dashboard familiar por padrao.

Mas o Admin pode liberar qualquer modulo para Caleb:

- Bancos;
- Relatorios;
- Investimentos;
- Contas;
- Dados de outras pessoas;
- Edicao ou exclusao, se desejar.

O sistema pode avisar o Admin quando ele liberar acesso amplo para perfil infantil, mas nao deve bloquear a acao.

### Membro financeiro sem login

Algumas pessoas podem existir apenas para controle financeiro, sem acesso ao app.

Exemplo:

- Caleb pode ter limite e gastos controlados sem login, ou pode ter login restrito, dependendo da decisao do Admin.

## Camadas de permissao

A permissao final deve considerar:

```txt
1. Role
2. Modulo
3. Acao
4. Escopo de dados
5. Funcionalidades especificas
```

## Roles sugeridos

```txt
admin
adult
child
custom
```

Role serve apenas para preset inicial. A permissao configurada pelo Admin e a fonte final da verdade.

## Modulos permissionaveis

- DASHBOARD
- PESSOAS
- GASTOS
- CONTAS_FIXAS
- CONTAS_A_PAGAR
- CONTAS_A_RECEBER
- BANCOS
- RENDAS
- RELATORIOS
- CONFIGURACOES
- ADMIN
- DIVIDAS futuro
- INVESTIMENTOS futuro
- ACOES futuro
- METAS futuro

## Acoes permissionaveis

Para cada modulo, o Admin podera configurar:

- can_view: pode visualizar;
- can_create: pode criar;
- can_edit: pode editar;
- can_delete: pode excluir.

## Escopo de dados

Cada permissao deve indicar o escopo:

```txt
own
selected
family
```

- own: usuario ve apenas o proprio membro financeiro vinculado.
- selected: usuario ve membros especificos liberados pelo Admin.
- family: usuario ve toda a familia.

## Funcionalidades especificas

Algumas liberacoes nao sao apenas modulos. Exemplos:

- view_own_dashboard;
- view_family_dashboard;
- view_own_limit;
- view_others_limit;
- create_own_expense;
- create_expense_for_others;
- view_banks;
- view_reports;
- view_investments;
- view_admin_shortcut;
- manage_users;
- manage_permissions;
- manage_limits;
- manage_categories;
- manage_fixed_expenses;
- view_stock_charts;
- view_investment_realtime_prices.

## Exemplos de permissao

| Usuario | Modulo | Ver | Criar | Editar | Excluir | Escopo |
|---|---|---:|---:|---:|---:|---|
| Pai | GASTOS | Sim | Sim | Sim | Nao | own |
| Mae | GASTOS | Sim | Sim | Sim | Nao | selected |
| Mae | CONTAS_A_PAGAR | Sim | Sim | Sim | Nao | selected |
| Gabryel | GASTOS | Sim | Sim | Nao | Nao | own |
| Caleb | GASTOS | Sim | Sim | Nao | Nao | own |
| Caleb | BANCOS | Sim | Nao | Nao | Nao | own, se Admin liberar |
| Admin | TODOS | Sim | Sim | Sim | Sim | family |

## Modelo de dados recomendado

```sql
profiles
- id
- auth_user_id
- name
- email
- role: admin | adult | child | custom
- linked_family_member_id
- is_active
- created_at

user_module_permissions
- id
- owner_id
- profile_id
- module
- can_view
- can_create
- can_edit
- can_delete
- scope: own | selected | family
- allowed_member_ids
- granted_by
- created_at
- updated_at

user_feature_permissions
- id
- owner_id
- profile_id
- feature_key
- is_enabled
- granted_by
- created_at
- updated_at
```

## Regras

1. Admin sempre tem acesso total.
2. Usuario familiar so acessa modulos liberados.
3. Usuario familiar ve apenas seus proprios dados por padrao.
4. Escopo `selected` permite ver pessoas especificas.
5. Escopo `family` permite visao consolidada.
6. Permissao deve ser aplicada no frontend, backend/server actions e RLS.
7. Menu deve esconder modulos sem permissao de visualizacao.
8. Botoes de criar, editar e excluir devem respeitar permissoes.
9. Dados sensiveis devem ser protegidos no banco, nao apenas na tela.
10. Dashboard deve mudar conforme o escopo do usuario.

## Impacto na implementacao

Antes de criar novos modulos avancados, implementar:

1. scope e allowed_member_ids em user_module_permissions;
2. user_feature_permissions;
3. helpers de permissao;
4. admin guard;
5. permission guard;
6. menu dinamico;
7. dashboard individual;
8. dashboard por pessoas selecionadas;
9. dashboard consolidado do Admin;
10. RLS reforcada no Supabase.

## Documentacao complementar

A estrategia completa de permissoes, funcionalidades liberaveis e evolucao do Dashboard esta em:

- `docs/PERMISSION_AND_DASHBOARD_STRATEGY.md`
