# Legacy Finance Helper Retirement Roadmap

Issues: #172, #173, #174, #175

## 1. Objetivo

Este documento organiza o proximo bloco de hardening antes de qualquer migration RLS real.

Ele agrupa quatro linhas de trabalho relacionadas:

- extracao de tipos compartilhados para reduzir acoplamento com helpers antigos owner-only;
- auditoria de admin/permissoes para multi-organization;
- planejamento do primeiro teste RLS real gated para `expense_categories`;
- ordem segura para executar essas etapas sem misturar escopos.

Esta PR nao altera codigo, testes, RLS, migrations, CI, rotas ou billing.

## 2. Contexto

A auditoria pos-harness indicou que nao ha gambiarra ativa evidente, mas ha dividas tecnicas transicionais relevantes:

- helpers antigos owner-only ainda existem;
- componentes ainda importam alguns tipos desses arquivos antigos;
- admin e permissoes ainda sao owner-centric;
- harness RLS ainda e preparatorio e nao prova RLS real.

Esses pontos nao devem ser resolvidos em uma unica PR de codigo.

## 3. Issues cobertas

### #172 - Plan type extraction for legacy finance helpers

Objetivo:

- planejar extracao de tipos compartilhados hoje definidos ou importados a partir de `lib/finance/server.ts` e `lib/finance/banks-server.ts`;
- reduzir acoplamento com arquivos que tambem contem helpers owner-only;
- preparar remocao futura sem quebrar componentes.

Resultado esperado futuro:

- tipos em arquivos neutros;
- componentes importando tipos de local neutro;
- helpers antigos ficando mais faceis de aposentar.

### #173 - Plan admin and permissions multi-organization audit

Objetivo:

- planejar auditoria de `lib/finance/admin-server.ts`;
- planejar auditoria de `lib/finance/access-control.ts`;
- mapear `profiles`, `user_module_permissions` e `user_feature_permissions` no contexto multi-org.

Resultado esperado futuro:

- clareza sobre quais regras continuam owner-centric;
- plano antes de rotas por `orgSlug`;
- plano antes de remover `owner_id`;
- base para hardening de admin/permissoes.

### #174 - Plan first gated RLS integration test for expense_categories

Objetivo:

- planejar a primeira suite real de RLS usando o harness gated;
- usar `expense_categories` como primeira tabela alvo;
- garantir que service role seja usada apenas para fixture/setup;
- validar isolamento com usuario autenticado comum.

Resultado esperado futuro:

- primeira suite RLS real, desativada por padrao;
- ativada somente com `RUN_RLS_TESTS=true` e variaveis `RLS_TEST_*`;
- sem tocar dados operacionais.

### #175 - Roadmap deste bloco

Objetivo:

- ordenar #172, #173 e #174;
- evitar PR grande misturando refactor, admin e testes externos;
- manter rastreabilidade.

## 4. Ordem recomendada

### Etapa 1 - Extracao de tipos

Issue base: #172.

Motivo para vir primeiro:

- e baixo risco;
- reduz acoplamento de componentes com helpers owner-only;
- prepara remocao futura sem mexer em regra de negocio.

PRs futuras sugeridas:

1. criar arquivo neutro de tipos financeiros;
2. migrar imports de componentes;
3. migrar imports de actions/helpers quando seguro;
4. manter exports temporarios se necessario, mas documentando prazo de remocao.

Fora de escopo nessa etapa:

- remover helpers owner-only;
- alterar queries;
- alterar RLS.

### Etapa 2 - Auditoria admin/permissoes

Issue base: #173.

Motivo para vir depois:

- admin/permissoes afetam todo o app;
- ainda ha dependencia de `owner_id`;
- exige mais cuidado que extracao de tipos.

PRs futuras sugeridas:

1. inventariar uso atual de `admin-server` e `access-control`;
2. mapear dependencias de `owner_id`;
3. mapear onde `organization_id` ja existe mas nao e usado;
4. propor fluxo multi-org futuro sem alterar UI ainda.

Fora de escopo nessa etapa:

- redesenhar UX de admin;
- alterar RLS;
- criar rotas por `orgSlug`.

### Etapa 3 - Primeiro teste RLS real gated

Issue base: #174.

Motivo para vir depois:

- depende do harness e fixtures;
- precisa de ambiente dedicado;
- nao deve ser misturado com refactor de tipos ou admin.

PRs futuras sugeridas:

1. documentar variaveis reais necessarias no ambiente de teste;
2. implementar suite `expense_categories` com skip seguro;
3. validar leitura organization A vs B;
4. validar fallback legado conforme estrategia documentada;
5. manter teste fora do fluxo padrao se ambiente nao existir.

Fora de escopo nessa etapa:

- primeira migration RLS;
- testar todas as tabelas;
- usar dados reais.

## 5. O que nao fazer em uma unica PR

Nao combinar:

- extracao de tipos;
- mudanca de queries;
- alteracao de admin/permissoes;
- teste real de RLS;
- migration de RLS;
- alteracao de CI;
- rotas por organization;
- billing.

Esses itens precisam continuar separados para manter revisao segura.

## 6. Criterios de sequenciamento

Antes de iniciar a primeira migration RLS real, o ideal e ter:

- tipos compartilhados desacoplados dos helpers owner-only;
- admin/permissoes auditados;
- pelo menos uma suite RLS real gated funcionando para `expense_categories`;
- fallback legado documentado e testavel;
- rollback documentado por tabela.

## 7. Conclusao

A melhor forma de acelerar sem gambiarra e agrupar o planejamento, mas manter as mudancas de codigo em PRs pequenas.

Este roadmap fecha o bloco de planejamento para #172, #173 e #174, mas nao substitui as PRs futuras de implementacao.
