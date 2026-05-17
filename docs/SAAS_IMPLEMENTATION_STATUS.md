# FamilyFinance SaaS - Status da Implementacao e Gates de Seguranca

## 1. Objetivo

Este documento registra o estado real da transicao SaaS multi-tenant do FamilyFinance.

Ele consolida:

- migrations base ja implementadas;
- bootstrap inicial da primeira organization;
- backfill inicial validado;
- modulos financeiros ja migrados para organization-aware;
- auditorias e testes de seguranca ja concluidos;
- riscos ainda pendentes;
- proximos gates antes de RLS financeira, rotas por `orgSlug`, billing e endurecimento definitivo de schema.

Este documento nao substitui os planos anteriores. Ele registra o estado atual da `main` apos os gates recentes.

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

A direcao aprovada e evoluir para um SaaS multi-tenant de gestao financeira familiar, onde cada organization representa uma familia, grupo financeiro, workspace ou conta contratante.

A fase atual continua sendo transicional. O projeto ainda nao deve ser tratado como SaaS final.

## 3. Documentos de referencia

A transicao SaaS esta documentada em:

- `docs/SAAS_MULTI_TENANT_STRATEGY.md`
- `docs/SAAS_DATABASE_MIGRATION_PLAN.md`
- `docs/INITIAL_ORGANIZATION_BACKFILL_PLAN.md`
- `docs/audits/OWNER_ID_FINANCE_QUERIES_AUDIT.md`
- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`
- `docs/pm/02_ESCOPO.md`
- `docs/pm/03_WBS_EAP.md`
- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`

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

Foi criada uma organization inicial de bootstrap no ambiente operacional.

Exemplo anonimizado do formato esperado:

```txt
slug: <initial-family-slug>
name: <Initial Family Name>
owner_auth_user_id: <auth-user-uuid>
owner email: <owner-email@example.com>
```

O membership owner inicial tambem foi criado.

Observacao de seguranca: identificadores reais de contas internas, UUIDs de usuarios de autenticacao e e-mails pessoais/operacionais nao devem ser versionados em documentacao publica ou compartilhavel. Quando necessario, registrar apenas placeholders ou exemplos anonimizados.

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

O projeto ainda opera em modo transicional:

```txt
owner_id + (organization_id atual OR organization_id IS NULL)
```

Esse padrao existe para evitar quebra em ambientes onde:

- a migration `007` ja foi aplicada;
- o backfill ainda nao foi executado em todos os ambientes;
- existem registros legados ainda sem `organization_id`;
- RLS financeira ainda nao foi convertida para membership/organization.

Este padrao nao e o modelo final de isolamento SaaS. Ele e uma ponte segura ate o hardening completo.

## 6. Decisoes tecnicas que continuam validas

### 6.1 `owner_id` continua existindo

`owner_id` ainda nao deve ser removido.

Ele continua sendo usado como camada de compatibilidade enquanto:

- `organization_id` ainda e nullable;
- RLS das tabelas financeiras ainda nao foi substituida por RLS multi-tenant;
- existem helpers legados ainda presentes;
- testes e auditorias precisam continuar antes de mudancas destrutivas.

### 6.2 `organization_id` ainda e nullable

`organization_id` nao deve ser tornado `NOT NULL` ainda.

Antes disso, ainda precisamos garantir:

- backfill validado em todos os ambientes;
- RLS multi-tenant planejada, testada e com rollback;
- nenhum fluxo restante criando registro sem `organization_id`;
- estrategia para registros legados `organization_id IS NULL`;
- CI e testes cobrindo cenarios cross-tenant suficientes.

### 6.3 Rotas continuam `/protected`

Ainda nao entramos em rotas por `orgSlug`.

Isso e intencional. As rotas por organization devem vir depois de:

- helpers server-side consolidados;
- queries/actions auditadas;
- UX para organization ativa;
- fallback para usuario com multiplas organizations;
- testes de acesso por slug;
- plano de migracao de links/rotas.

### 6.4 Billing ainda esta fora da implementacao

Billing e parte da visao SaaS futura, mas ainda nao deve ser implementado.

Antes de billing, precisamos concluir:

- isolamento de dados;
- RLS multi-tenant;
- rotas/UX de organization;
- limites por plano;
- modelo de assinatura;
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

## 8. Regras por modulo ja implementadas

### 8.1 Pessoas

Pessoas usam o padrao:

```txt
owner_id + (organization_id atual OR organization_id IS NULL)
```

Regras atuais:

- criacao de novo membro grava `organization_id`;
- edicao de membro legado preenche `organization_id`;
- ativacao/desativacao de membro legado preenche `organization_id`;
- queries respeitam organization ativa ou legado.

### 8.2 Configuracoes / categorias

Categorias usam organization ativa ou legado.

Regras atuais:

- criacao grava `organization_id`;
- edicao de categoria legada preenche `organization_id`;
- exclusao respeita owner e organization/legado;
- categorias padrao continuam protegidas contra edicao indevida.

### 8.3 Configuracoes / limites

Atualizacao de limite mensal de membro aceita membros da organization ativa ou legados.

Ao atualizar membro legado, a action tambem preenche `organization_id`.

### 8.4 Contas a pagar

Contas a pagar foram migradas para organization-aware.

Regras atuais:

- criacao grava `organization_id`;
- edicao/status preenchem `organization_id` em registros legados;
- delete respeita owner e organization/legado;
- `responsible_member_id` precisa pertencer a organization ativa ou ser legado.

Essa regra evita criar conta em uma organization vinculada a membro de outra organization.

### 8.5 Bancos

Bancos foram migrados para organization-aware.

Regras atuais:

- criacao grava `organization_id`;
- edicao/saldo preenchem `organization_id` em registros legados;
- delete respeita owner e organization/legado;
- `family_member_id` precisa pertencer a organization ativa ou ser legado;
- IDs de membros usados para listar bancos sao derivados de membros filtrados por organization ativa ou legado;
- listagem de bancos nao deve depender de `is_active = true`, pois bancos sao registros historicos e nao devem sumir quando um membro e desativado.

### 8.6 Contas a receber

Contas a receber foram migradas para organization-aware.

Regras atuais:

- criacao grava `organization_id`;
- edicao/status preenchem `organization_id` em registros legados;
- delete respeita owner e organization/legado;
- `receiver_member_id` precisa pertencer a organization ativa ou ser legado.

### 8.7 Gastos

Gastos foram migrados para organization-aware.

Regras atuais:

- criacao grava `organization_id`;
- edicao preenche `organization_id` em registros legados;
- delete respeita owner e organization/legado;
- `family_member_id` precisa pertencer a organization ativa ou ser legado;
- `category_id`, quando informado, precisa pertencer a organization ativa ou ser legado.

### 8.8 Relatorios

Relatorios reutilizam helpers organization-aware dos modulos ja migrados:

- Gastos;
- Contas a pagar;
- Contas a receber;
- Bancos.

Isso reduz duplicacao e evita reabrir queries antigas por `owner_id` diretamente.

### 8.9 Dashboard

O Dashboard global `/protected` usa dados organization-aware dos modulos migrados.

Ele ainda usa as rotas atuais e a UI atual, mas os dados agregados seguem a organization ativa via helpers por dominio:

- `@/lib/organizations/expenses`;
- `@/lib/organizations/payables`;
- `@/lib/organizations/receivables`;
- `@/lib/organizations/banks`.

## 9. Gates de seguranca concluidos

### Gate 1 - Auditoria de queries/actions `owner_id` only

Status: **concluido**.

Referencias:

- Issue #133: `Audit remaining owner_id-only finance queries`;
- PR #134: `Audit remaining owner_id-only finance queries`;
- Documento: `docs/audits/OWNER_ID_FINANCE_QUERIES_AUDIT.md`.

O que foi entregue:

- busca e classificacao de ocorrencias `.eq("owner_id"`;
- separacao entre uso protegido por helper organization-aware, uso temporario aceitavel e helpers antigos ainda presentes;
- testes de guarda para impedir que paginas migradas voltem a importar helpers owner-only antigos;
- testes de guarda para manter filtros organization/legado em helpers `lib/organizations/*`.

Achados importantes:

- `lib/organizations/*` usa `owner_id` com organization ativa ou legado, como esperado na fase transicional;
- helpers antigos em `lib/finance/server.ts` e `lib/finance/banks-server.ts` ainda existem e nao devem voltar a ser usados por telas migradas;
- `lib/finance/admin-server.ts` e `lib/finance/access-control.ts` ainda precisam de hardening futuro para multi-org pleno.

### Gate 2 - Testes cross-tenant dos vinculos financeiros criticos

Status: **concluido para os vinculos principais dos modulos migrados**.

Cobertura entregue:

- Gastos:
  - `family_member_id` precisa pertencer a organization ativa ou ser legado;
  - `category_id` precisa pertencer a organization ativa ou ser legado;
  - testes foram endurecidos para afirmar os filtros reais `.eq("owner_id", ...)` e `.or("organization_id.eq.<org>,organization_id.is.null")`.
- Contas a pagar:
  - `responsible_member_id` precisa pertencer a organization ativa ou ser legado;
  - testes afirmam filtros reais de owner e organization/legado.
- Contas a receber:
  - `receiver_member_id` precisa pertencer a organization ativa ou ser legado;
  - testes afirmam filtros reais de owner e organization/legado.
- Bancos:
  - `family_member_id` precisa pertencer a organization ativa ou ser legado;
  - testes afirmam filtros reais de owner e organization/legado;
  - listagem de bancos preserva contas historicas vinculadas a membros inativos;
  - testes garantem que a query de membros para bancos nao volte a depender de `.eq("is_active", true)`.

PRs relacionadas:

- #136: testes iniciais de gastos;
- #138: endurecimento dos testes de gastos para validar filtros reais;
- #140: testes de contas a pagar;
- #142: testes de contas a receber;
- #144: testes de criacao/validacao de bancos;
- #145: testes de listagem historica de bancos com membros inativos.

### Gate 3 - Garantia de `organization_id` em novos registros

Status: **concluido para os principais fluxos de criacao migrados**.

Referencias:

- Issue #146: `Ensure new finance records receive organization_id`;
- PR #147: `Guard organization_id on finance inserts`.

Cobertura entregue:

Os testes de guarda validam que os fluxos de criacao abaixo continuam gravando `organization_id` dentro da propria funcao de criacao:

- `family_members`;
- `expense_categories`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`.

Observacao importante: o teste foi ajustado para procurar `organization_id: organization.id` dentro do corpo da funcao `create*` correspondente, evitando falso positivo causado por `organization_id` presente em updates posteriores no mesmo arquivo.

## 10. Riscos ainda existentes

Mesmo com os gates 1, 2 e 3 concluidos, a fase SaaS ainda nao esta completa.

Riscos pendentes:

- RLS das tabelas financeiras ainda nao foi convertida para membership/organization;
- `organization_id` ainda e nullable;
- `owner_id` segue ativo por compatibilidade;
- rotas ainda nao usam `orgSlug`;
- usuario com multiplas organizations ainda precisa de UX explicita para selecao de organization;
- billing ainda nao esta implementado;
- admin e permissions ainda precisam de hardening multi-org pleno;
- backfill precisa ser validado em todos os ambientes antes de qualquer `NOT NULL`;
- helpers antigos owner-only ainda existem e precisam continuar isolados de telas migradas ate serem migrados/removidos com seguranca.

## 11. Proximos gates recomendados

### Gate 4 - Planejamento de RLS multi-tenant financeira

Objetivo:

```txt
Substituir gradualmente RLS baseada apenas em owner_id por RLS baseada em organization membership.
```

Pre-condicoes antes de implementar:

- confirmar que todos os fluxos novos gravam `organization_id`;
- revisar backfill nos ambientes reais;
- criar plano de rollback;
- planejar policies por tabela;
- evitar policies recursivas em `organization_memberships`;
- manter compatibilidade temporaria com registros `organization_id IS NULL`, se necessario;
- criar testes focados antes/depois das policies.

### Gate 5 - UX de organization ativa e multiplas organizations

Objetivo:

```txt
Definir como o usuario seleciona, troca e entende a organization ativa.
```

Antes de rotas por `orgSlug`, precisamos decidir:

- comportamento para usuario em uma organization;
- comportamento para usuario em multiplas organizations;
- fallback deterministico;
- tela/selector de organization;
- autorizacao visual e server-side alinhadas.

### Gate 6 - Rotas por `orgSlug`

Objetivo:

```txt
Migrar de /protected para rotas com organization explicita.
```

Exemplos futuros:

```txt
/[orgSlug]/dashboard
/[orgSlug]/gastos
/[orgSlug]/contas-a-pagar
```

Nao fazer antes de RLS, helpers, UX de organization ativa e testes de acesso por slug estarem planejados.

### Gate 7 - Billing

Billing so entra depois de:

- organization segura;
- RLS segura;
- rotas/UX de organization;
- limites por plano definidos;
- modelo de assinatura definido;
- auditoria operacional.

### Gate 8 - `organization_id NOT NULL` e possivel remocao futura de `owner_id`

Nao fazer agora.

Esse gate so deve ser considerado depois de:

- backfill validado em todos os ambientes;
- nenhuma action criando registro sem `organization_id`;
- RLS multi-tenant validada;
- rotas/UX estabilizadas;
- plano de rollback;
- confirmacao de que registros legados foram tratados.

## 12. Padrao para proximas PRs

Toda PR da fase SaaS deve declarar explicitamente:

- se altera banco;
- se altera RLS;
- se altera rotas;
- se altera Server Actions;
- se altera queries;
- se altera billing;
- como preserva compatibilidade com `organization_id IS NULL`;
- como evita cross-tenant access;
- quais testes cobrem a mudanca;
- quais riscos continuam fora do escopo.

## 13. Status final desta fase

A fase atual pode ser descrita como:

```txt
SaaS multi-tenant em transicao endurecida, com modulos principais organization-aware e gates iniciais de auditoria/testes concluidos.
```

Ainda nao e o SaaS final porque:

- `owner_id` segue ativo;
- `organization_id` segue nullable;
- RLS financeira ainda nao foi endurecida;
- rotas por `orgSlug` ainda nao existem;
- UX de multiplas organizations ainda nao existe;
- billing ainda nao existe.

Mas a base funcional e os principais testes de seguranca ja estao melhor preparados para a proxima fase: planejamento cuidadoso de RLS multi-tenant financeira.
