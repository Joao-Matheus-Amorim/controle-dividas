# Owner ID Retirement Inventory

> Status DocDoc: Atual
> Uso atual: inventario PMBOK do G-005 para planejar a retirada futura de
> `owner_id` sem quebrar compatibilidade, RLS, admin, seeds ou relatorios.
> Fonte-base: `docs/audits/PMBOK_GAP_DEBT_CONTROL_PLAN_2026-06-01.md`.

Atualizado em: 2026-06-01

## 1. Objetivo

Este documento transforma a divida tecnica `owner_id` em uma fila controlada.

Ele nao remove `owner_id`, nao altera schema, nao altera RLS e nao muda runtime.
O objetivo e impedir retirada prematura antes de evidencia real e de um plano
por dominio.

## 2. Estado atual

`owner_id` continua no modelo transicional.

Uso seguro atual:

```txt
owner_id + organization_id
```

Uso proibido como conclusao:

```txt
owner_id removivel agora
```

O isolamento SaaS atual depende de `organization_id`, memberships ativos,
helpers server-side e RLS. `owner_id` ainda participa de write ownership,
compatibilidade, seeds, fixtures, admin e helpers legados.

## 3. Fontes verificadas

Busca executada nesta revisao:

```txt
rg -n "owner_id" app lib features components supabase __tests__ docs
rg -n "owner_id" lib/organizations lib/finance app/protected
```

Documentos cruzados:

- `docs/SAAS_GAP_REGISTER.md`
- `docs/audits/OWNER_ID_FINANCE_QUERIES_AUDIT.md`
- `docs/audits/PMBOK_GAP_DEBT_CONTROL_PLAN_2026-06-01.md`
- `docs/SAAS_RLS_LIVE_STATUS.md`
- `docs/VALIDACAO_TECNICA.md`

## 4. Matriz de dependencias

| Camada | Exemplos | Estado | Acao segura |
| --- | --- | --- | --- |
| Migrations historicas | `001_family_finance_schema.sql`, `004_permission_scope_and_features.sql`, `005_payable_bill_types.sql` | `owner_id` e parte do historico versionado | nao reescrever migrations antigas |
| RLS atual | migrations `030` a `039`, guards RLS | select ja privilegia organizacao; writes ainda podem manter ownership | alterar apenas com migration nova e gate RLS |
| Actions financeiras | `app/protected/gastos/actions.ts`, `contas-a-pagar`, `contas-a-receber`, `bancos`, `pessoas`, `configuracoes` | category settings e people/family_members write actions ja sao organization-scoped por owner/admin e novos registros preservam `owner_id` legado da organizacao; demais actions ainda usam `owner_id` com contexto de organizacao ativa | migrar um dominio por PR apos preflight |
| Helpers organization-aware | `lib/organizations/*` | `lib/organizations/people.ts` e `lib/organizations/categories.ts` ja leem por organizacao; demais helpers ainda filtram `owner_id`, mas combinam com organizacao | manter ate substituto organization-only ser provado |
| Helpers legados | `lib/finance/server.ts`, `members-server.ts`, `categories-server.ts`, `expenses-server.ts`, `payables-server.ts`, `receivables-server.ts`, `banks-server.ts` | compatibilidade e testes ainda dependem deles | inventariar consumidores antes de remover |
| Admin/permissoes | `lib/finance/admin-server.ts`, `app/protected/admin/actions.ts`, `lib/finance/access-control.ts` | maior risco; read/write path admin e access-control ja estao organization-first, com `owner_id` ainda transicional no modelo | seguir contrato admin lifecycle por PR |
| Seeds/bootstrap | `lib/finance/seed-*`, `bootstrap-admin-profile.ts` | criacao inicial ainda grava `owner_id` | trocar somente quando schema final existir |
| Testes RLS | `__tests__/integration/rls/*` | usam mesmo owner em duas organizacoes para provar isolamento por organization | manter ate novo fixture organization-only provar o mesmo caso |
| Unit guards | `legacy-organization-fallback-removal-*`, `*-rls-policy-guards` | protegem estado transicional | atualizar junto com cada remocao |
| Docs/ADRs | ADR 0006, ADR 0007, gap register, roadmap | dizem que `owner_id` e transicional | atualizar so depois de PRs verdes |

## 5. Gates obrigatorios antes de retirar

Nenhum PR pode remover `owner_id` sem:

1. RLS Live Gate verde com artifact `rls-live-gate-evidence-*`;
2. inventario de consumidores do dominio alvo;
3. preflight read-only no banco alvo;
4. plano de rollback ou recuperacao;
5. migration nova, nunca reescrita de migration antiga;
6. guard focado que prove que o dominio nao voltou para helper owner-only;
7. docs atualizados no mesmo PR.

## 6. Sequencia recomendada

| Ordem | PR | Escopo | Fora de escopo |
| --- | --- | --- | --- |
| 1 | consumidores ativos | mapear imports/callers dos helpers owner-only | remover codigo |
| 2 | fixtures RLS organization-only | criar fixture que prove isolamento sem depender de owner compartilhado | alterar policies |
| 3 | dominio piloto | escolher um dominio financeiro pequeno e trocar read path para organization-only | admin, billing, todos os dominios |
| 4 | write path piloto | remover `owner_id` do write ownership do mesmo dominio, se RLS permitir | schema drop |
| 5 | admin/access-control | read/write path admin e access-control ja versionados organization-first | misturar com dominio financeiro |
| 6 | schema final | remover constraints/indices/coluna somente apos todos os callers | qualquer runtime pendente |

## 7. Criterios de aceite para fechar G-005

G-005 so pode sair de "aberto controlado" quando houver:

- zero callers runtime que precisem de `owner_id` para isolamento;
- RLS Live Gate verde apos a ultima troca;
- migrations novas aplicadas sem reescrever historico;
- fixtures RLS cobrindo duas organizacoes com usuario/caso adversarial;
- admin lifecycle definido sem `ADMIN_EMAIL` como unica garantia;
- docs centrais atualizados.

## 8. Decisao operacional

Estado atual:

```txt
G-005 permanece aberto controlado; read/write path admin, access-control e categorias organization-first estao versionados, reads de pessoas organization-first estao versionados, mas writes de pessoas, seeds, demais consumidores e schema final seguem transicionais.
```

Proximo PR recomendado:

```txt
proximo consumidor de `owner_id` em PR dedicado, sem remover ADMIN_EMAIL ou owner_id.
```

Esse proximo PR deve preservar audit/rate-limit e nao deve misturar access-control
ou schema final.

Execucao do inventario:

```txt
docs/audits/OWNER_ID_ACTIVE_CONSUMERS_2026-06-01.md
```
