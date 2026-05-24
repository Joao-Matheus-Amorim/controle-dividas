# ADR 0006 - Current SaaS transition architecture

## Status

Aceito

## Data

2026-05-24

## Contexto

O projeto está em fase transicional de SaaS financeiro multi-tenant.

O onboarding inicial já existe em `/onboarding/organizacao`.

A documentação viva registra RLS transicional, runtime organization-aware, E2E gated e hardening parcial de `organization_id`.

Este ADR registra o contrato arquitetural atual sem alterar ADRs históricos.

## Decisão

O estado atual não deve ser tratado como arquitetura final.

A organização ativa vem das memberships ativas do usuário.

Quando existir membership ativa com role owner, ela define o contexto padrão. Se não existir owner, o primeiro contexto ativo em ordem estável é usado.

Ainda não existem selector de organização, rotas por orgSlug ou billing.

## Contrato de dados

`organization_id` é o caminho correto do SaaS.

`owner_id` permanece como compatibilidade transicional.

Já estão hardened:

- `expense_categories` pela migration `020`;
- `family_members` pela migration `021`.

As demais tabelas tenant-scoped continuam transicionais até decisão própria.

## Ordem de evolução

1. Manter CI verde.
2. Manter documentação e guards alinhados.
3. Continuar hardening por PR pequeno.
4. Planejar selector antes de orgSlug.
5. Planejar billing somente depois da maturidade multi-org.
6. Remover compatibilidade legada somente em etapa futura própria.

## Fora de escopo

Este ADR não altera runtime, schema, RLS, UI, billing, E2E, dados ou fallback legado.

## Relação com issues/PRs

- Issue: #577
- PR: #578