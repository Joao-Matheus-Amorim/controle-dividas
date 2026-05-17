# FamilyFinance SaaS - Status da Implementacao e Proximos Gates de Seguranca

## 1. Objetivo

Este documento registra o estado real da transicao SaaS multi-tenant do FamilyFinance apos a implementacao das migrations base, bootstrap da organization inicial, backfill inicial e migracao dos principais modulos financeiros para `organization_id`.

A finalidade e dar norte ao produto e ao desenvolvimento antes de avancar para auditoria, endurecimento de RLS, rotas por `orgSlug`, billing e fases comerciais.

## 2. Estado estrategico atual

O FamilyFinance nasceu como uma aplicacao financeira familiar privada. Essa fase validou:

- autenticacao;
- dashboard;
- membros financeiros;
- gastos;
- contas a pagar;
- contas a receber;
- bancos;
- relatorios;
- configuracoes;
- admin familiar;
- permissoes por modulo e acao;
- escopos de dados;
- PWA/mobile-first;
- testes e CI.

A nova direcao aprovada e evoluir para um SaaS multi-tenant de gestao financeira familiar, onde cada organization representa uma familia, grupo financeiro, workspace ou conta contratante.

## 3. Documentos de referencia

A transicao SaaS esta documentada em:

- `docs/SAAS_MULTI_TENANT_STRATEGY.md`
- `docs/SAAS_DATABASE_MIGRATION_PLAN.md`
- `docs/INITIAL_ORGANIZATION_BACKFILL_PLAN.md`
- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`
- `docs/pm/02_ESCOPO.md`
- `docs/pm/03_WBS_EAP.md`
- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`

Este documento complementa os anteriores com o status real apos as primeiras implementacoes.

## 4. Migrations e banco

### 4.1 Implementado

Foram implementadas as migrations:

```txt
006_organizations_memberships.sql
007_add_organization_id_columns.sql
```

A migration `006` criou:

- `organizations`;
- `organization_memberships`;
- indices basicos;
- RLS nas novas tabelas;
- helpers RLS nao recursivos;
- policies basicas das novas tabelas.

A migration `007` adicionou `organization_id` nullable em:

- `profiles`;
- `family_members`;
- `expense_categories`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`;
- `user_module_permissions`;
- `user_feature_permissions`.

### 4.2 Bootstrap executado

Foi criada a organization inicial:

```txt
slug: amorim
name: Familia Amorim
owner_auth_user_id: 108ea2ec-8615-4740-a923-34e6f92484cc
owner email: joaomatheus.lab@gmail.com
```

Tambem foi criado o membership owner inicial.

### 4.3 Backfill inicial validado

O backfill inicial de `organization_id` foi executado e validado com os seguintes totais:

```txt
profiles: 2/2
family_members: 5/5
expense_categories: 0/0
expenses: 0/0
payable_bills: 2/2
receivable_incomes: 0/0
banks: 0/0
user_module_permissions: 15/15
user_feature_permissions: 0/0
```

## 5. Padrao transicional atual

O projeto ainda esta em uma fase transicional.

O padrao aplicado nos modulos migrados e:

```txt
owner_id + (organization_id atual OR organization_id IS NULL)
```

Esse padrao existe para evitar quebra em ambientes onde:

- a migration `007` ja foi aplicada;
- mas o backfill ainda nao foi executado;
- ou existem registros legados ainda sem `organization_id`.

## 6. Decisoes tecnicas atuais

### 6.1 `owner_id` continua existindo

`owner_id` ainda nao deve ser removido.

Ele continua sendo usado como camada de compatibilidade enquanto:

- `organization_id` ainda e nullable;
- RLS das tabelas financeiras ainda nao foi substituida por RLS multi-tenant;
- queries antigas ainda podem existir;
- testes e auditorias cross-tenant ainda nao foram finalizados.

### 6.2 `organization_id` ainda e nullable

`organization_id` nao deve ser tornado `NOT NULL` ainda.

Antes disso, precisamos garantir:

- auditoria completa de queries;
- auditoria completa de actions;
- backfill validado em todos os ambientes;
- testes automatizados cross-tenant;
- RLS multi-tenant planejado e testado;
- nenhum fluxo criando registro sem `organization_id`.

### 6.3 Rotas continuam `/protected`

Ainda nao entramos em rotas por `orgSlug`.

Isso e intencional. As rotas por organization devem vir depois de:

- helpers server-side consolidados;
- queries/actions auditadas;
- decisao de UX para organization ativa;
- fallback para usuario com multiplas organizations;
- testes de acesso por slug.

### 6.4 Billing ainda esta fora da implementacao

Billing e parte da visao SaaS futura, mas ainda nao deve ser implementado.

Antes de billing, precisamos concluir:

- isolamento de dados;
- RLS multi-tenant;
- rotas por organization;
- onboarding/organization switcher;
- limites por plano;
- auditoria operacional.

## 7. Modulos ja migrados para organization-aware

Os seguintes modulos ja foram migrados para usar helpers/queries baseados em organization:

```txt
Pessoas
Configuracoes / categorias
Configuracoes / limites de membros
Contas a pagar
Bancos
Contas a receber
Gastos
Relatorios
Dashboard
```

## 8. Modulos e ajustes realizados

### 8.1 Pessoas

Foi criado suporte para listar e alterar membros financeiros considerando:

```txt
owner_id + (organization_id atual OR organization_id IS NULL)
```

Criacao de novo membro grava `organization_id`.

Edicao e ativacao/desativacao de membro legado passam a preencher `organization_id`.

### 8.2 Configuracoes / categorias

Categorias passaram a ser lidas por organization ativa ou legado.

Criacao grava `organization_id`.

Edicao de categoria legada preenche `organization_id`.

Exclusao respeita owner e organization/legado.

### 8.3 Configuracoes / limites

Atualizacao de limite mensal de membro aceita membros da organization ativa ou legados.

Ao atualizar membro legado, a action tambem preenche `organization_id`.

### 8.4 Contas a pagar

Contas a pagar foram migradas para organization-aware.

Regras importantes:

- criacao grava `organization_id`;
- edicao/status preenchem `organization_id` em registros legados;
- delete respeita owner e organization/legado;
- `responsible_member_id` precisa pertencer a organization ativa ou ser legado.

Essa ultima regra evita criar conta em uma organization vinculada a membro de outra organization.

### 8.5 Bancos

Bancos foram migrados para organization-aware.

Apos revisao, foi corrigido um ponto importante: os IDs de membros usados para listar bancos agora sao derivados de membros ja filtrados por organization ativa ou legado, nao apenas de permissoes owner-wide.

Tambem foi removido o filtro rigido `is_active = true` na derivacao de membros para bancos, pois bancos sao registros historicos e nao devem sumir quando um membro e desativado.

### 8.6 Contas a receber

Contas a receber foram migradas para organization-aware.

Regras importantes:

- criacao grava `organization_id`;
- edicao/status preenchem `organization_id` em registros legados;
- delete respeita owner e organization/legado;
- `receiver_member_id` precisa pertencer a organization ativa ou ser legado.

### 8.7 Gastos

Gastos foram migrados para organization-aware.

Regras importantes:

- criacao grava `organization_id`;
- edicao preenche `organization_id` em registros legados;
- delete respeita owner e organization/legado;
- `family_member_id` precisa pertencer a organization ativa ou ser legado;
- `category_id`, quando informado, precisa pertencer a organization ativa ou ser legado.

### 8.8 Relatorios

Relatorios foram migrados para reutilizar os helpers organization-aware dos modulos ja migrados:

- Gastos;
- Contas a pagar;
- Contas a receber;
- Bancos.

Isso reduz duplicacao e evita reabrir queries antigas por `owner_id` diretamente.

### 8.9 Dashboard

O Dashboard global `/protected` passou a usar dados organization-aware dos modulos migrados.

Ele ainda usa as rotas atuais e a UI atual, mas os dados agregados ja seguem a organization ativa via helpers.

## 9. Riscos ainda existentes

Mesmo com os modulos principais migrados, a fase SaaS ainda nao esta completa.

Riscos pendentes:

- ainda podem existir queries antigas usando apenas `owner_id`;
- ainda podem existir actions antigas sem validacao por organization;
- `organization_id` ainda e nullable;
- RLS das tabelas financeiras ainda nao foi convertida para membership/organization;
- rotas ainda nao usam `orgSlug`;
- usuario com multiplas organizations ainda precisa de UX explicita para selecao de organization;
- billing ainda nao esta implementado;
- testes cross-tenant ainda precisam ser ampliados.

## 10. Proximos gates de seguranca

A proxima fase deve ser auditoria, nao uma nova feature grande.

### Gate 1 - Auditoria de queries e actions

Objetivo:

```txt
Mapear tudo que ainda usa apenas owner_id sem organization_id.
```

Itens:

- buscar `.eq("owner_id"` em todo o projeto;
- classificar por modulo;
- identificar se ainda precisa migrar;
- identificar se ja esta protegido por helper organization-aware;
- abrir issues especificas.

### Gate 2 - Testes cross-tenant

Objetivo:

```txt
Garantir que dados de uma organization nao aparecem em outra.
```

Cenarios minimos:

- usuario owner da organization A;
- usuario owner da organization B;
- usuario membro de duas organizations;
- registros legados `organization_id IS NULL`;
- registros ja com `organization_id`;
- tentativas de vincular member/category de outra organization.

### Gate 3 - Hardening de criacao de dados

Objetivo:

```txt
Garantir que todo novo registro financeiro recebe organization_id.
```

Antes de tornar `organization_id` obrigatorio, toda action precisa estar auditada.

### Gate 4 - RLS multi-tenant das tabelas financeiras

Objetivo:

```txt
Substituir gradualmente RLS baseada apenas em owner_id por RLS baseada em organization membership.
```

Pre-condicoes:

- todos os fluxos criando `organization_id`;
- backfill validado;
- testes cross-tenant;
- plano de rollback;
- ambiente de staging/teste validado.

### Gate 5 - Rotas por orgSlug

Objetivo:

```txt
Migrar de /protected para rotas com organization explicita.
```

Exemplo futuro:

```txt
/[orgSlug]/dashboard
/[orgSlug]/gastos
/[orgSlug]/contas-a-pagar
```

Nao fazer antes de RLS e helpers estarem auditados.

### Gate 6 - Billing

Billing so entra depois de:

- organization segura;
- RLS segura;
- rotas/UX de organization;
- limites por plano definidos;
- modelo de assinatura definido.

## 11. Padrao para proximas PRs

Toda PR da fase SaaS deve declarar explicitamente:

- se altera banco;
- se altera RLS;
- se altera rotas;
- se altera Server Actions;
- se altera queries;
- se altera billing;
- como preserva compatibilidade com `organization_id IS NULL`;
- como evita cross-tenant access.

## 12. Proxima PR recomendada

A proxima PR recomendada e:

```txt
Audit remaining owner_id-only finance queries
```

Ela deve ser uma PR de auditoria/documentacao ou uma issue tecnica antes de qualquer novo hardening.

Nao devemos tornar `organization_id` obrigatorio nem alterar RLS financeira antes dessa auditoria.

## 13. Status final desta fase

A fase atual pode ser descrita como:

```txt
SaaS multi-tenant em transicao funcional, com modulos principais organization-aware, mas ainda em modo compatibilidade.
```

Ainda nao e o SaaS final porque:

- `owner_id` segue ativo;
- `organization_id` segue nullable;
- RLS financeira ainda nao foi endurecida;
- rotas por orgSlug ainda nao existem;
- billing ainda nao existe.

Mas a base funcional ja esta preparada para a proxima fase de auditoria e hardening.
