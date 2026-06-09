# Owner ID Active Consumers Inventory

> Status DocDoc: Atual
> Uso atual: inventario de consumidores ativos dos helpers owner-only antes da
> retirada futura de `owner_id`.
> Fonte-base: `docs/audits/OWNER_ID_RETIREMENT_INVENTORY_2026-06-01.md`.

Atualizado em: 2026-06-01

## 1. Objetivo

Este documento executa o primeiro PR recomendado pelo inventario G-005:

```txt
inventariar consumidores ativos dos helpers owner-only em lib/finance/*.
```

Ele nao remove `owner_id`, nao troca imports e nao altera runtime.

## 2. Busca executada

```txt
rg -n 'from "@/lib/finance/' app components features
rg -n 'get.*ByOwner|FromClient|get.*DashboardData|seedInitialFinanceDataForOwner' lib app features components __tests__
```

## 3. Resultado operacional

| Grupo | Consumidor runtime ativo | Status | Proxima acao |
| --- | --- | --- | --- |
| Dashboard financeiro | `features/protected-pages/dashboard-page.tsx` usa `lib/organizations/*` | nao consome helper owner-only direto | manter guard existente |
| Gastos | `features/protected-pages/gastos-page.tsx` usa `lib/organizations/expenses` | nao consome helper owner-only direto | dominio piloto candidato depois dos gates |
| Contas a pagar | `features/protected-pages/contas-a-pagar-page.tsx` usa `lib/organizations/payables` | nao consome helper owner-only direto | manter fora do primeiro piloto |
| Contas a receber | `features/protected-pages/contas-a-receber-page.tsx` usa `lib/organizations/receivables` | nao consome helper owner-only direto | manter fora do primeiro piloto |
| Bancos | `features/protected-pages/bancos-page.tsx` usa `lib/organizations/banks` | nao consome helper owner-only direto | manter fora do primeiro piloto |
| Relatorios | `features/protected-pages/relatorios-page.tsx` usa `lib/organizations/reports` | nao consome helper owner-only direto | nao voltar para `lib/finance/reports-server.ts` |
| Admin | `features/protected-pages/admin*.tsx` usa `lib/finance/admin-server.ts` | excecao admin parcial; read/write path e access-control ja estao organization-first, com `owner_id` ainda transicional no modelo | seguir contrato admin/access-control proprio |
| Pessoas | `lib/organizations/people.ts`, `features/protected-pages/pessoas-page.tsx`, `app/protected/pessoas/actions.ts`, `supabase/migrations/049_family_members_organization_write_rls.sql` | consumidor reduzido: helper e pagina usam `organization_id`; create/edit/status/limit controls e actions exigem owner/admin; write RLS de `family_members` e organization-admin-scoped; create preserva `owner_id` como owner legado da organizacao para compatibilidade | manter `owner_id` ate schema final e nao aplicar esse padrao aos outros dominios sem migration/RLS dedicada |
| Categorias | `lib/organizations/categories.ts`, `features/protected-pages/configuracoes-page.tsx`, `app/protected/configuracoes/actions.ts`, `supabase/migrations/048_expense_categories_organization_write_rls.sql` | consumidor reduzido: helper e Configuracoes usam `organization_id`; category write/actions e RLS de `expense_categories` sao scoped a owner/admin da organizacao; create preserva `owner_id` como owner legado da organizacao para compatibilidade | manter `owner_id` ate schema final e nao aplicar esse padrao aos outros dominios sem migration/RLS dedicada |
| Seeds/bootstrap | `lib/finance/server.ts` chama `seedInitialFinanceDataForOwner` | ativo na criacao inicial | manter ate schema final |
| Facade legado | `lib/finance/server.ts` exporta agregadores owner-based | sem consumidor direto nas protected pages migradas | nao remover sem inventario de imports externo |
| Reports legado | `lib/finance/reports-server.ts` agrega helpers owner-based | sem consumidor direto nas protected pages migradas | manter bloqueado por guard |

## 4. Decisao

Estado atual:

```txt
helpers owner-only ainda existem, mas as telas financeiras protegidas migradas
nao devem importar `lib/finance/server.ts`, `lib/finance/banks-server.ts` ou
`lib/finance/reports-server.ts`.
```

Excecao ativa parcial:

```txt
Admin usa `lib/finance/admin-server.ts`, `app/protected/admin/actions.ts` e
`lib/finance/access-control.ts`; read/write path e access-control estao
organization-first, com gate admin por organizacao ativa nos reads/writes admin.
```

Essa excecao nao libera outras importacoes legadas nas paginas admin. As paginas
`features/protected-pages/admin*.tsx` tambem devem continuar bloqueadas contra
`lib/finance/server.ts`, `lib/finance/banks-server.ts` e
`lib/finance/reports-server.ts`.

## 5. Estado do contrato admin/access-control

Antes de qualquer retirada de `owner_id`, o contrato admin/access-control deve
continuar como gate para writes/access-control:

```txt
admin/access-control owner_id retirement contract
```

Contrato criado em:

```txt
docs/audits/ADMIN_ACCESS_CONTROL_OWNER_ID_RETIREMENT_CONTRACT.md
```

Fixture RLS criada neste ciclo:

```txt
__tests__/integration/rls/admin-multi-org.rls.test.ts
```

Esse contrato ainda bloqueia schema final ate concluir:

- como substituir consumidores restantes de `owner_id`;
- como resolver `profile_id`, `linked_family_member_id` e permissoes por organizacao;
- como manter owner/admin-only sem depender de `ADMIN_EMAIL` como garantia final;
- como executar e arquivar o RLS Live Gate verde com artifact para a fixture admin multi-org.

O contrato de convite/admin que define a direcao final existe em:

```txt
docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md
```

Esse contrato ja possui runtime parcial de convite/admin, delivery/UI, cron de
expiracao e read/write path admin organization-first com admin gate por organizacao,
mas nao autoriza remover
`ADMIN_EMAIL` ou `owner_id`.

## 6. Fora de escopo

Este inventario nao faz:

- remocao de `owner_id`;
- troca de helpers;
- alteracao de schema;
- alteracao de RLS;
- alteracao de admin runtime;
- alteracao de seeds;
- alteracao visual.
