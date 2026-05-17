# Auditoria de queries financeiras `owner_id` only

Issue: #133

## Objetivo

Mapear ocorrencias restantes de queries/actions financeiras que ainda usam `owner_id` e classificar o risco antes dos proximos gates SaaS multi-tenant.

Esta auditoria nao altera banco, RLS, rotas, billing ou UI.

## Contexto transicional

O projeto ainda opera em modo transicional:

```txt
owner_id + (organization_id atual OR organization_id IS NULL)
```

Isso preserva compatibilidade com registros legados enquanto `organization_id` ainda e nullable e antes da troca de RLS financeira para membership/organization.

## Metodo

Busca principal executada:

```txt
.eq("owner_id"
```

Tambem foram revisados usos de helpers antigos em modulos ja migrados para organization-aware.

## Classificacao usada

1. Protegido por helper organization-aware.
2. Query/action antiga que precisa migrar.
3. Uso aceitavel temporario por compatibilidade.
4. Risco de cross-tenant.

## Resultado resumido

| Area | Classificacao | Status |
| --- | --- | --- |
| `lib/organizations/*` | 1 / 3 | Uso esperado do padrao transicional |
| Actions financeiras migradas | 1 / 3 | Validam organization ativa e legado |
| Dashboard `/protected` | 1 | Usa helpers organization-aware |
| Relatorios | 1 | Usa helpers organization-aware |
| `lib/finance/server.ts` | 2 / 3 | Helpers antigos owner-only ainda existem, mas nao devem ser usados por telas migradas |
| `lib/finance/banks-server.ts` | 2 / 3 | Helper antigo owner-only ainda existe, nao deve ser usado por tela migrada |
| `lib/finance/admin-server.ts` | 2 / 3 | Admin ainda usa escopo owner-only; precisa auditoria propria antes de multi-org admin |
| `lib/finance/access-control.ts` | 2 / 3 | Permissoes ainda derivam de owner/profile; precisa hardening futuro para organization |

## Ocorrencias protegidas por helpers organization-aware

Os helpers em `lib/organizations/*` usam `owner_id` como camada de compatibilidade, mas combinam com filtro de organization ativa ou legado:

```txt
owner_id + (organization_id.eq.<organizationId> OR organization_id IS NULL)
```

Arquivos auditados nessa categoria:

- `lib/organizations/people.ts`
- `lib/organizations/categories.ts`
- `lib/organizations/payables.ts`
- `lib/organizations/receivables.ts`
- `lib/organizations/expenses.ts`
- `lib/organizations/banks.ts`
- `lib/organizations/reports.ts`

Classificacao: **1 - protegido por helper organization-aware** e **3 - aceitavel temporariamente por compatibilidade**.

## Actions financeiras migradas

As Server Actions dos modulos migrados ainda usam `.eq("owner_id", ...)`, mas agora tambem usam organization ativa/legado nas operacoes sensiveis.

Arquivos auditados:

- `app/protected/pessoas/actions.ts`
- `app/protected/configuracoes/actions.ts`
- `app/protected/contas-a-pagar/actions.ts`
- `app/protected/contas-a-receber/actions.ts`
- `app/protected/gastos/actions.ts`
- `app/protected/bancos/actions.ts`

Pontos validados:

- novos registros gravam `organization_id`;
- atualizacoes de registros legados tendem a preencher `organization_id`;
- deletes/updates usam owner + organization ativa/legado;
- IDs relacionados sao validados contra organization ativa ou legado, quando aplicavel.

Classificacao: **1 - protegido** e **3 - aceitavel temporariamente**.

## Helpers antigos ainda presentes

Os seguintes helpers antigos continuam relevantes para compatibilidade, tipos ou admin legado, mas nao devem ser usados por telas financeiras ja migradas:

- `lib/finance/server.ts`
- `lib/finance/banks-server.ts`
- `lib/finance/admin-server.ts`
- `lib/finance/access-control.ts`

### `lib/finance/server.ts`

Ainda contem funcoes owner-only como:

- `getFamilyMembers()`
- `getExpenseCategories()`
- `getExpenses()`
- `getPayableBills()`
- `getReceivableIncomes()`
- `getExpenseDashboardData()`
- `getPayableBillsDashboardData()`
- `getReceivableIncomesDashboardData()`

Risco: se paginas migradas voltarem a importar esses helpers, podem perder o filtro organization-aware.

Classificacao: **2 - precisa migrar/remover em fase futura** e **3 - aceitavel temporariamente apenas se nao usado por telas migradas**.

### `lib/finance/banks-server.ts`

Ainda contem `getBankAccounts()` e `getBanksDashboardData()` com escopo owner-only.

Risco: se a pagina de bancos voltar para esse helper antigo, pode ignorar organization ativa.

Classificacao: **2 - precisa migrar/remover em fase futura**.

### `lib/finance/admin-server.ts`

Admin familiar ainda e baseado em `owner_id` e precisa de auditoria especifica antes de virar admin multi-org.

Classificacao: **2 - precisa auditoria futura**.

### `lib/finance/access-control.ts`

Permissoes ainda derivam de perfil/owner e membros ativos.

Risco principal: helpers organization-aware compensam isso filtrando membros pela organization ativa, mas o modelo de permissao em si ainda nao e multi-tenant pleno.

Classificacao: **2 - precisa hardening futuro** e **3 - aceitavel temporariamente enquanto os callers filtram por organization**.

## Testes adicionados nesta fase

Foram adicionados testes de guarda para evitar regressao arquitetural:

- Dashboard `/protected` deve continuar importando helpers de `lib/organizations/*`.
- Relatorios organization-aware nao devem importar agregadores antigos de `lib/finance/server`.
- Paginas migradas nao devem importar helpers antigos owner-only de `lib/finance/server` ou `lib/finance/banks-server`.
- Helpers `lib/organizations/*` devem manter o filtro de compatibilidade `organization_id.eq.<id> OR organization_id IS NULL`.

Esses testes nao substituem testes cross-tenant reais com banco/RLS, mas bloqueiam regressao simples de import/escopo.

## Achados de risco

Nenhum risco critico novo foi corrigido nesta PR, porque o escopo e auditoria + testes.

Riscos que devem virar proximas issues:

1. Migrar ou aposentar helpers owner-only restantes em `lib/finance/server.ts`.
2. Migrar ou aposentar `lib/finance/banks-server.ts` apos confirmar que nao ha consumidores ativos.
3. Auditar admin multi-org em `lib/finance/admin-server.ts`.
4. Evoluir `access-control.ts` para considerar organization ativa diretamente.
5. Criar testes cross-tenant com fixtures de organization A/B e registros legados.

## Recomendacao

Antes de avancar para RLS financeira, rotas `[orgSlug]`, billing ou `organization_id NOT NULL`, abrir issues separadas para os riscos acima e priorizar testes cross-tenant.

## Fora de escopo confirmado

Esta auditoria nao faz:

- alteracao de schema;
- alteracao de RLS;
- alteracao de rotas;
- implementacao de billing;
- remocao de `owner_id`;
- obrigatoriedade de `organization_id`;
- refatoracao visual.
