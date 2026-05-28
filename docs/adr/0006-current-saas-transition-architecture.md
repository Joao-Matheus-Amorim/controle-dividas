# ADR 0006 - Current SaaS transition architecture

## Status

Aceito

## Data

2026-05-24

## Atualizacao operacional

2026-05-28

## Contexto

O projeto esta em fase transicional endurecida de SaaS financeiro multi-tenant.

O onboarding inicial ja existe em `/onboarding/organizacao`.

A documentacao viva registra RLS por organization membership, runtime organization-aware, E2E gated, hardening `organization_id NOT NULL` nas tabelas tenant-scoped principais e remocao do fallback RLS legado `organization_id IS NULL`.

Este ADR registra o contrato arquitetural atual sem alterar ADRs historicos.

## Decisao

O estado atual nao deve ser tratado como arquitetura final.

A organizacao ativa vem das memberships ativas do usuario.

Quando existir membership ativa com role owner, ela define o contexto padrao. Se nao existir owner, o primeiro contexto ativo em ordem estavel e usado.

O indicador e a troca de organizacao ativa ja existem no app protegido.

Ainda nao existem rotas por `orgSlug` ou billing.

## Contrato de dados

`organization_id` e o caminho correto do SaaS.

`owner_id` permanece como compatibilidade transicional e write ownership.

Ja estao hardened com `organization_id NOT NULL`:

- `expense_categories` pela migration `020`;
- `family_members` pela migration `021`;
- `expenses` pela migration `022`;
- `payable_bills` pela migration `023`;
- `receivable_incomes` pela migration `024`;
- `banks` pela migration `025`;
- `user_module_permissions` pela migration `026`;
- `user_feature_permissions` pela migration `027`;
- `profiles` pela migration `028`.

O fallback RLS legado `organization_id IS NULL` foi removido pelas migrations `030` a `038`.

## Ordem de evolucao

1. Manter CI verde.
2. Manter documentacao e guards alinhados.
3. Versionar a limpeza idempotente das policies antigas `*_own`/`*_family`.
4. Rodar RLS Live Gate em CI dedicado.
5. Provar troca de organizacao ativa por E2E gated multi-org.
6. Planejar rotas por `orgSlug`.
7. Planejar billing somente depois da maturidade multi-org.
8. Remover `owner_id` apenas em etapa futura propria.

## Fora de escopo

Este ADR nao altera runtime, schema, RLS, UI, billing, E2E, dados ou fallback legado.

## Relacao com issues/PRs

- Issue: #577
- PR: #578
- Status vivo: `docs/SAAS_RLS_LIVE_STATUS.md`
- Roadmap operacional: `docs/SAAS_OPERATIONAL_ROADMAP.md`
