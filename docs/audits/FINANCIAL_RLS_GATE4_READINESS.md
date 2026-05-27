# Financial RLS Gate 4 Readiness

## 1. Objetivo

Este documento registra o estado de readiness para iniciar o Gate 4 de RLS financeira multi-tenant.

Esta PR nao altera:

- migrations;
- policies RLS;
- helpers SQL;
- codigo runtime;
- rotas;
- billing;
- `organization_id NOT NULL`;
- remocao de `owner_id`.

O objetivo e deixar claro o proximo corte seguro antes da primeira migration RLS de hardening.

## 2. Pre-condicoes confirmadas

As pre-condicoes abaixo ja estao registradas na `main`:

- Gate 1 concluiu a auditoria de queries/actions `owner_id` only.
- Gate 2 concluiu os testes cross-tenant dos vinculos financeiros criticos.
- Gate 3 concluiu a guarda de `organization_id` em novos registros financeiros.
- Gate 5 concluiu a UX de organizacao ativa com seletor, cookie de organizacao e troca explicita.
- O limite transicional de uma membership ativa por usuario foi removido pela migration `029_drop_one_active_membership_per_user_limit.sql`.
- O inventario atual de policies RLS esta versionado em `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`.
- O plano de RLS financeira esta versionado em `docs/FINANCIAL_RLS_MULTI_TENANT_PLAN.md`.

## 3. Helpers SQL para a primeira fase

Os helpers existentes sao suficientes para a primeira fase de RLS financeira:

```txt
public.current_user_organization_ids()
public.is_organization_member(target_organization_id uuid)
public.is_organization_admin(target_organization_id uuid)
```

Nao ha justificativa atual para criar helper novo antes da primeira migration de hardening.

Qualquer mudanca futura em helper deve manter:

- `security definer`;
- `set search_path = public`;
- ausencia de policy recursiva em `organization_memberships`;
- grants explicitos para roles necessarias;
- rollback documentado no corpo da PR.

## 4. Modelo transicional ainda valido

O modelo atual ainda deve preservar compatibilidade com legado:

```txt
organization_id em escopo de membership
OR organization_id IS NULL restrito por owner_id
```

Esse fallback nao e o modelo SaaS final.

Ele so deve ser removido depois de:

- evidencia de zero linhas legadas em todos os ambientes relevantes;
- backfill validado;
- actions confirmadas gravando `organization_id`;
- testes RLS gated simulando usuario autenticado comum;
- rollback documentado.

## 5. Primeiro corte recomendado

O primeiro corte de hardening RLS nao deve misturar todas as tabelas financeiras.

Ordem recomendada:

1. Confirmar ou ajustar teste RLS gated focado em uma tabela de menor impacto.
2. Aplicar uma migration RLS em apenas uma superficie.
3. Validar leitura/escrita por usuario comum da organization correta.
4. Validar negacao cross-tenant.
5. Validar fallback legado apenas quando a tabela ainda permitir `organization_id IS NULL`.
6. Documentar rollback completo.

Primeiro alvo recomendado:

```txt
expense_categories
```

Racional:

- ja possui policies transicionais dedicadas nas migrations `008` e `009`;
- ja possui hardening `NOT NULL` em `organization_id` pela migration `020`;
- ja possui teste RLS gated versionado para validar comportamento por usuario autenticado comum;
- tem impacto menor que `expenses`, `payable_bills`, `receivable_incomes` e `banks`;
- e dependencia importante para gastos, entao serve como prova de padrao para remover fallback RLS legado antes de tabelas de maior impacto.

Status do primeiro corte:

- migration `030_expense_categories_rls_remove_legacy_fallback.sql` remove o fallback `organization_id IS NULL` de `expense_categories`;
- migration `031_family_members_rls_remove_legacy_fallback.sql` remove o fallback `organization_id IS NULL` de `family_members`;
- migration `032_expenses_rls_remove_legacy_fallback.sql` remove o fallback `organization_id IS NULL` de `expenses`;
- as policies passam a depender de `public.is_organization_member(organization_id)`;
- update/delete continuam owner-scoped durante a transicao.

## 6. Fora de escopo do proximo PR de migration

O proximo PR de migration RLS nao deve incluir:

- rotas por `orgSlug`;
- billing;
- alteracao visual;
- `organization_id NOT NULL`;
- remocao de `owner_id`;
- mudancas em todas as tabelas financeiras;
- refactor amplo de Server Actions.

## 7. Criterio de pronto para iniciar hardening

O Gate 4 pode iniciar o primeiro PR de migration quando a PR incluir:

- uma tabela alvo;
- teste RLS gated especifico;
- migration pequena;
- rollback SQL claro;
- texto explicito sobre legado `organization_id IS NULL`;
- ausencia de mudanca em UI, billing, rotas e schema destrutivo.
