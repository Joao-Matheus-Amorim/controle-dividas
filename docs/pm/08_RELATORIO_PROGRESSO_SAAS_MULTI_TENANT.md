# Relatorio de Progresso PMBOK - SaaS Multi-Tenant

## 1. Identificacao

Projeto: **FamilyFinance / controle-dividas**

Fase: **Transicao SaaS multi-tenant com hardening de seguranca**

Documento: **Relatorio de progresso da fase SaaS**

Objetivo: registrar, em formato alinhado ao PMBOK, o progresso recente, entregas, decisoes, riscos, qualidade e proximos passos da evolucao multi-tenant.

## 2. Resumo executivo

A fase recente do projeto consolidou a transicao do FamilyFinance de uma aplicacao familiar privada para uma base SaaS multi-tenant em modo transicional.

Foram concluidos:

- documentacao estrategica SaaS;
- migrations base de organizations/memberships e `organization_id` nullable;
- helpers server-side de organization;
- migracao dos principais modulos financeiros para organization-aware;
- auditoria de queries/actions `owner_id` only;
- testes cross-tenant dos principais vinculos financeiros;
- guardas para inserts com `organization_id`;
- planejamento de RLS financeira multi-tenant;
- harness inicial de testes RLS;
- extracao inicial de tipos financeiros para arquivo neutro.

O projeto ainda nao esta no modelo SaaS final. `owner_id` continua ativo, `organization_id` continua nullable, RLS financeira multi-tenant ainda nao foi implementada, rotas por `orgSlug` ainda nao existem e billing ainda esta fora do escopo.

## 3. Escopo concluido

### 3.1 Planejamento e estrategia

Entregas:

- estrategia SaaS multi-tenant documentada;
- alinhamento PMBOK atualizado;
- plano de migration SaaS documentado;
- status de implementacao SaaS atualizado;
- plano de RLS financeira multi-tenant criado;
- inventario atual de RLS documentado;
- estrategia de helpers RLS documentada;
- estrategia de legado `organization_id IS NULL` documentada;
- rollout e rollback RLS documentados;
- plano de testes RLS documentado.

PRs relacionadas:

- #95
- #96
- #97
- #132
- #149
- #156
- #157
- #158
- #160
- #161
- #162
- #163

### 3.2 Banco e base SaaS

Entregas:

- migration `006_organizations_memberships.sql`;
- migration `007_add_organization_id_columns.sql`;
- `organizations` e `organization_memberships` criadas;
- helpers RLS nao recursivos criados;
- `organization_id` nullable adicionado nas tabelas existentes;
- indices por `organization_id` adicionados.

Restricoes preservadas:

- `owner_id` nao removido;
- `organization_id` nao tornado `NOT NULL`;
- RLS financeira antiga nao alterada pela migration 007;
- nenhum billing implementado.

PRs relacionadas:

- #100
- #103

### 3.3 Bootstrap e backfill inicial

Entregas:

- organization inicial criada no ambiente operacional;
- membership owner inicial criado;
- backfill inicial validado para profiles, membros, contas a pagar e permissoes.

Observacao de seguranca:

- identificadores reais de usuario, UUIDs e e-mails nao devem ser publicados em documentacao versionada;
- a documentacao atual usa placeholders anonimizados.

PRs relacionadas:

- #102
- #132

### 3.4 Helpers server-side de organization

Entregas:

- `lib/organizations/types.ts`;
- `lib/organizations/server.ts`;
- `getUserOrganizations`;
- `getCurrentOrganization`;
- `getCurrentMembership`;
- `requireOrganizationAccess`;
- `requireOrganizationAdmin`.

Decisao tecnica:

- `import "server-only"` foi removido dos helpers porque Vitest/Vite nao resolvia esse import no CI.

PR relacionada:

- #107

### 3.5 Modulos migrados para organization-aware

Modulos concluidos:

- Pessoas;
- Configuracoes / categorias;
- Configuracoes / limites de membros;
- Contas a pagar;
- Bancos;
- Contas a receber;
- Gastos;
- Relatorios;
- Dashboard.

Padrao transicional aplicado:

```txt
owner_id + (organization_id atual OR organization_id IS NULL)
```

PRs relacionadas:

- #109
- #112
- #114
- #116
- #118
- #121
- #123
- #124
- #126
- #128
- #130

## 4. Qualidade e testes

### 4.1 Auditoria owner_id-only

Entregas:

- auditoria de `.eq("owner_id"`;
- classificacao de usos protegidos, usos temporarios e riscos;
- guards arquiteturais para evitar regressao para helpers owner-only.

PRs/issues:

- #133
- #134

### 4.2 Testes cross-tenant por vinculos financeiros

Coberturas implementadas:

- gastos: `family_member_id` e `category_id`;
- contas a pagar: `responsible_member_id`;
- contas a receber: `receiver_member_id`;
- bancos: `family_member_id`;
- bancos: listagem historica nao depende de `is_active = true`.

PRs relacionadas:

- #136
- #138
- #140
- #142
- #144
- #145

### 4.3 Guardas de inserts com organization_id

Cobertura:

- `family_members`;
- `expense_categories`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`.

Observacao:

- o teste foi ajustado para procurar `organization_id` dentro do corpo da funcao de criacao correta, evitando falso positivo.

PR relacionada:

- #147

### 4.4 Harness RLS

Entregas:

- estrategia de harness RLS documentada;
- esqueleto gated por `RUN_RLS_TESTS=true`;
- variaveis dedicadas `RLS_TEST_*`;
- fixtures locais iniciais para `expense_categories`;
- correcoes para UUIDs validos e slugs compativeis com constraint de `organizations.slug`.

PRs relacionadas:

- #165
- #167
- #169

Status:

- harness ainda e preparatorio;
- ainda nao prova RLS real;
- nao toca Supabase real por padrao;
- service role nao deve ser usada como prova de seguranca.

## 5. Refatoracao tecnica recente

### 5.1 Extracao de tipos financeiros

Entregas:

- criado `lib/finance/types.ts`;
- migrados imports de tipos em componentes de bancos;
- migrados imports de tipos em contas a pagar;
- migrados imports de tipos em contas a receber;
- migrados imports de tipos em gastos;
- migrados imports de tipos em pessoas;
- migrados imports de tipos em configuracoes, relatorios e admin/users;
- migrado `lib/organizations/banks.ts` para tipos neutros.

PRs relacionadas:

- #178
- #180
- #182
- #184

Escopo preservado:

- sem alteracao de queries;
- sem alteracao de Server Actions;
- sem alteracao de RLS;
- sem alteracao de banco/migrations;
- sem alteracao de rotas/billing;
- sem alteracao visual intencional.

## 6. Controle de mudancas

### 6.1 Mudancas aceitas

- mudanca de estrategia de produto para SaaS multi-tenant;
- introducao de organizations/memberships;
- adicao de `organization_id` nullable;
- migracao gradual de modulos para organization-aware;
- aumento de cobertura de testes cross-tenant;
- criacao de planos e guardas antes de RLS real;
- extracao gradual de tipos para reduzir acoplamento com helpers owner-only.

### 6.2 Mudancas recusadas ou adiadas

- remover `owner_id`;
- tornar `organization_id` obrigatorio;
- alterar RLS financeira agora;
- migrar rotas para `[orgSlug]` agora;
- implementar billing/Stripe agora;
- misturar refatoracao, RLS, billing e rotas em PR unica;
- usar service role como prova de seguranca RLS;
- usar dados reais para testes RLS.

## 7. Riscos atuais

| Risco | Status | Mitigacao |
| --- | --- | --- |
| Helpers owner-only antigos ainda existem | Aberto | Guards e extracao gradual de tipos |
| Admin/permissoes ainda owner-centric | Aberto | Auditoria futura especifica |
| RLS financeira ainda owner-centric | Aberto | Plano RLS, inventario, rollout e rollback documentados |
| `organization_id` nullable | Aceito temporariamente | Backfill, guards de inserts e fallback legado controlado |
| Harness RLS ainda nao prova RLS real | Aceito temporariamente | Flag `RUN_RLS_TESTS` e plano de ambiente dedicado |
| Registros legados `organization_id IS NULL` | Aceito temporariamente | Fallback documentado e condicoes para remocao futura |
| Possivel regressao de imports antigos | Reduzido | `lib/finance/types.ts` e migracoes de imports |

## 8. Decisoes importantes

1. Manter `owner_id` ate RLS multi-tenant, backfill e testes estarem maduros.
2. Manter `organization_id` nullable ate validacao de todos os ambientes.
3. Nao alterar RLS financeira sem inventario, testes e rollback.
4. Nao implementar billing antes de isolamento de dados estar solido.
5. Nao migrar para rotas `[orgSlug]` antes de UX de organization ativa e RLS estarem planejadas.
6. Preferir PRs pequenas, rastreaveis e com CI verde.
7. Evitar documentos excessivos daqui para frente, priorizando execucao controlada.

## 9. Estado atual do projeto

O projeto esta em:

```txt
SaaS multi-tenant em transicao endurecida.
```

Ja existe:

- base de organizations/memberships;
- modulos financeiros principais organization-aware;
- testes cross-tenant de actions;
- guards de criacao com `organization_id`;
- plano RLS completo;
- harness RLS inicial;
- extracao parcial de tipos financeiros.

Ainda falta:

- primeira suite RLS real gated;
- primeira migration RLS real;
- auditoria admin/permissoes multi-org;
- UX de organization ativa;
- rotas por `orgSlug`;
- billing;
- `organization_id NOT NULL`;
- remocao futura de `owner_id`.

## 10. Proximos passos recomendados

### 10.1 Curto prazo

- buscar imports antigos restantes em codigo real;
- migrar imports de tipos restantes em PRs pequenas;
- implementar primeira suite RLS real gated para `expense_categories`, se ambiente dedicado estiver pronto;
- auditar admin/permissoes multi-org.

### 10.2 Medio prazo

- preparar primeira migration RLS de menor risco;
- validar rollback;
- expandir RLS por tabela/grupo pequeno;
- validar dashboard e relatorios apos cada etapa.

### 10.3 Longo prazo

- UX de organization ativa;
- rotas por `orgSlug`;
- billing/Stripe;
- endurecimento de schema;
- remocao futura de `owner_id`, somente se seguro.

## 11. Fora de escopo deste relatorio

Este documento nao altera:

- codigo;
- testes;
- banco;
- migrations;
- RLS;
- rotas;
- billing;
- UI.

## 12. Conclusao

A fase recente reduziu riscos importantes sem pular etapas criticas. O projeto avancou de uma migracao multi-tenant estrutural para uma base com modulos organization-aware, testes cross-tenant, planejamento RLS e refatoracao inicial de tipos.

O foco daqui para frente deve ser execucao tecnica controlada, evitando excesso de documentacao e mantendo PRs pequenas com impacto real.
