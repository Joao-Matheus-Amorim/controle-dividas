---
name: supabase-master
description: >-
  Padrões de dados e segurança multi-tenant do FamilyFinance no Supabase.
  Use ao escrever queries/server actions, escopar por organização ativa, criar
  ou revisar migrations/RLS, lidar com organization_id, memberships, roles,
  auth, ou ao tocar em owner_id/billing. Garante isolamento por organização e
  respeita os gates de hardening — não afrouxa RLS nem ativa billing.
---

# Supabase master — FamilyFinance (multi-tenant)

Backend: Supabase (Auth + Postgres + RLS organization-aware). Direção: ADR 0001
(SaaS-first), ADR 0006 (arquitetura transicional), ADR 0007 (orgSlug). Status
vivo: `docs/SAAS_RLS_LIVE_STATUS.md`, `docs/SAAS_OPERATIONAL_ROADMAP.md`.

## Regra de ouro: tudo é escopado pela organização ativa

Toda leitura/escrita financeira passa por `lib/organizations/server.ts`. Não
consultar tabelas tenant-scoped sem resolver a organização primeiro.

```ts
import {
  getCurrentOrganization,        // Organization | null
  getCurrentOrganizationContext, // { organization, membership } | null
  getCurrentMembership,          // membership da org ativa
  requireOrganizationAccess,     // lança se sem acesso → use em server actions
  requireOrganizationAdmin,      // exige role owner|admin
  getUserOrganizations,          // todas as orgs ativas do usuário
} from "@/lib/organizations/server";

// Em server action / query de domínio:
const { organization, membership } = await requireOrganizationAccess(orgSlug);
// …então .eq("organization_id", organization.id) em toda query.
```

- Auth: `supabase.auth.getClaims()` (não `getUser` solto); sem claim → `redirect("/auth/login")`.
- Org ativa: cookie `ACTIVE_ORGANIZATION_COOKIE_NAME`, com fallback para a org
  `owner` ou a primeira (`getDefaultOrganizationContext`).
- Clientes: `@/lib/supabase/server` (server) — respeite o boundary
  (`supabase-client-boundary-guards`, `supabase-proxy-entrypoint-guards`).

## Modelo multi-tenant

- `organizations` + `organization_memberships` (role: `owner` | `admin` | …;
  `is_active`).
- `organization_id NOT NULL` nas tabelas principais (`expenses`, `payable_bills`,
  `receivable_incomes`, `banks`, `expense_categories`, `family_members`,
  `profiles`, `user_module_permissions`, `user_feature_permissions`).
- **RLS por membership**, sem o fallback legado `organization_id IS NULL`
  (removido nas migrations `030–038`).
- `owner_id` ainda existe (write ownership / compat) — **não remover** sem
  preflight, dry-run, gates e rollback.

## Queries de domínio

Use os helpers já existentes por entidade em vez de SQL solto:
- `lib/organizations/{expenses,payables,receivables,banks,categories,people,reports}.ts`
  (escopo por org) e `lib/finance/*-server.ts` (lógica de servidor).
- `lib/finance/access-control.ts` decide módulos/escopo visíveis
  (own/selected/family) — respeite a regra: permissão sempre vence o role,
  dentro da organização.

## Migrations & RLS

- Convenção `supabase/migrations/NNN_descricao.sql` (sequência `006`–`039`).
  Padrão: adicionar coluna → RLS org-aware → hardening NOT NULL → remover
  fallback legado.
- `019_initial_organization_onboarding_rpc.sql` precisa estar aplicada antes de
  depender do onboarding em runtime.
- Hardening `020–028` exige **evidência recente de preflight/dry-run com zero
  linhas bloqueadas/ambíguas** na tabela-alvo antes de aplicar.
- RLS real é testada em suite **gated** (`RUN_RLS_TESTS=true` + projeto Supabase
  dedicado); por padrão fica `false`. Detalhes: `docs/rls/RLS_TEST_HARNESS.md`.

## Não faça

- Não afrouxar/remover RLS nem reintroduzir fallback `organization_id IS NULL`.
- Não ativar billing: `lib/billing/stripe-config.ts` é só fronteira; checkout/
  webhook/portal ficam fora de runtime até isolamento+UX+permissões amadurecerem.
- Não consultar tabela tenant-scoped sem `organization_id`.
- Não remover `owner_id` nem policies owner/family sem os gates da migration `039`.
- Não usar produção nem usuário real em E2E/RLS — só projeto/usuário dedicados.

## Guard tests relevantes (afirmam o contrato)

`*-org-scope-hardening-guards`, `*-rls-policy-guards`,
`*-org-scope-preflight-dry-run-guards`, `organization-id-insert-guards`,
`organization-query-guards`, `orgslug-routing-contract-guards`,
`supabase-client-boundary-guards`, `legacy-organization-*`,
`billing-*-runtime-guards`. Rode `npm run test` antes do push; um afrouxamento
de escopo aparece aqui.
