# Post RLS Harness Technical Debt Audit

Issue: #170

## 1. Objetivo

Auditar dividas tecnicas e possiveis gambiarras restantes depois da criacao do harness RLS e antes de qualquer migration RLS financeira.

Esta auditoria nao altera codigo de producao, testes, migrations, RLS, rotas ou billing.

## 2. Escopo revisado

Foram revisados os seguintes pontos:

- silenciamentos de lint/typecheck;
- helpers antigos owner-only;
- imports ativos de helpers antigos;
- harness RLS gated;
- fixtures locais de `expense_categories`;
- docs RLS recentes;
- testes de guarda contra regressao.

## 3. Resultado executivo

Nao foram encontrados sinais ativos de gambiarra explicita como:

```txt
eslint-disable
@ts-ignore
@ts-expect-error
TODO
FIXME
HACK
workaround
gambiarra
```

Os principais pontos restantes sao dividas tecnicas controladas, ja esperadas pela fase transicional.

## 4. Achados

### 4.1 Helpers antigos owner-only ainda existem

Status: **divida tecnica controlada**.

Arquivos ja conhecidos:

- `lib/finance/server.ts`
- `lib/finance/banks-server.ts`
- `lib/finance/admin-server.ts`
- `lib/finance/access-control.ts`

Risco:

- se paginas migradas voltarem a importar helpers de query owner-only, podem ignorar `organization_id`.

Mitigacao atual:

- `docs/audits/OWNER_ID_FINANCE_QUERIES_AUDIT.md` documenta esse risco;
- `__tests__/unit/organization-query-guards.test.ts` impede paginas protegidas migradas de importar `@/lib/finance/server` e `@/lib/finance/banks-server`;
- dashboard e relatorios possuem guards especificos para continuar usando helpers `lib/organizations/*`.

Classificacao:

```txt
Aceitavel temporariamente, mas precisa plano futuro de migracao/remocao.
```

Proxima issue recomendada:

```txt
Plan removal or type extraction for legacy owner-only finance helpers
```

### 4.2 Componentes ainda importam tipos de helpers antigos

Status: **divida tecnica baixa/media**.

Exemplo observado:

- componentes de bancos importam tipos como `BankAccountFormState`, `DbBankAccount` e `DbFamilyMember` de `@/lib/finance/banks-server` e `@/lib/finance/server`.

Risco:

- nao e risco imediato de cross-tenant, porque sao imports de tipo/componentes client-side;
- mas mantem acoplamento nominal aos arquivos owner-only antigos;
- pode dificultar remocao futura desses helpers.

Mitigacao atual:

- guard atual bloqueia imports desses helpers em paginas migradas;
- os componentes usam actions e dados ja filtrados pelo lado server.

Classificacao:

```txt
Aceitavel temporariamente, mas deve virar extracao futura de tipos para arquivos neutros.
```

Proxima issue recomendada:

```txt
Extract shared finance types away from legacy owner-only helpers
```

### 4.3 Admin e permissoes ainda sao owner-centric

Status: **divida tecnica importante**.

Arquivos relacionados:

- `lib/finance/admin-server.ts`
- `lib/finance/access-control.ts`
- `user_module_permissions`
- `user_feature_permissions`

Risco:

- admin/permissoes ainda nao representam multi-org pleno;
- podem afetar visibilidade do app inteiro;
- devem ser tratados antes de rotas por `orgSlug` e antes de remover `owner_id`.

Mitigacao atual:

- documentado em `OWNER_ID_FINANCE_QUERIES_AUDIT.md`;
- documentado no plano RLS;
- fora do escopo das migrations RLS financeiras iniciais.

Classificacao:

```txt
Precisa issue propria antes de multi-org pleno.
```

Proxima issue recomendada:

```txt
Audit admin and permissions for multi-organization access
```

### 4.4 Harness RLS ainda nao prova RLS real

Status: **etapa preparatoria legitima**.

Arquivos:

- `__tests__/integration/rls/helpers.ts`
- `__tests__/integration/rls/harness.test.ts`
- `docs/rls/RLS_TEST_HARNESS.md`

Risco:

- se for interpretado como prova de RLS real, cria falsa sensacao de seguranca.

Mitigacao atual:

- harness fica desativado por padrao;
- exige `RUN_RLS_TESTS=true`;
- exige variaveis dedicadas `RLS_TEST_*`;
- nao conecta em Supabase real por padrao;
- documentacao explicita que service role nao prova RLS.

Classificacao:

```txt
Nao e gambiarra. E base preparatoria.
```

Proxima issue recomendada:

```txt
Implement first gated RLS integration test for expense_categories
```

### 4.5 Fixtures locais foram corrigidas para schema real

Status: **ok apos correcao**.

Historico:

- versao inicial usava IDs string como `rls_test_..._org_a`, invalidos para colunas UUID;
- versao inicial gerava slugs com underscore, invalidos para constraint de `organizations.slug`.

Estado atual:

- IDs usam `crypto.randomUUID()`;
- slugs sao sanitizados para `^[a-z0-9]+(?:-[a-z0-9]+)*$`;
- testes validam formatos.

Classificacao:

```txt
Corrigido. Sem acao imediata.
```

### 4.6 Documentos RLS tiveram exemplo DELETE corrigido

Status: **corrigido**.

Historico:

- documentacao de helpers sugeria `WITH CHECK` em trecho de escrita administrativa que poderia ser copiado para DELETE;
- `WITH CHECK` nao se aplica a policy `FOR DELETE`.

Estado atual:

- doc separa UPDATE e DELETE;
- DELETE usa apenas `USING`;
- issue #159 e PR #160 corrigiram a orientacao.

Classificacao:

```txt
Corrigido. Sem acao imediata.
```

### 4.7 Testes de guarda por busca textual

Status: **aceitavel com cautela**.

Arquivos relacionados:

- `__tests__/unit/organization-query-guards.test.ts`
- `__tests__/unit/organization-id-insert-guards.test.ts`

Risco:

- testes por leitura de fonte podem gerar falso positivo se forem amplos demais;
- ja ocorreu um caso e foi corrigido ao limitar a busca ao corpo da funcao `create*`.

Mitigacao atual:

- guard de inserts foi endurecido para procurar no corpo da funcao correta;
- guards de imports sao simples e adequados ao objetivo.

Classificacao:

```txt
Aceitavel como guard arquitetural, mas nao substitui testes funcionais/RLS reais.
```

## 5. Classificacao consolidada

| Item | Classificacao | Acao |
| --- | --- | --- |
| Silenciamentos de lint/typecheck | Nao encontrado | Nenhuma |
| Helpers owner-only antigos | Divida controlada | Planejar migracao/remocao |
| Imports de tipos de helpers antigos | Divida baixa/media | Extrair tipos futuramente |
| Admin/permissoes owner-centric | Divida importante | Issue propria |
| Harness RLS preparatorio | Aceitavel | Evoluir para teste real gated |
| Fixtures UUID/slug | Corrigido | Nenhuma imediata |
| Docs DELETE/WITH CHECK | Corrigido | Nenhuma imediata |
| Guards por fonte | Aceitavel com cautela | Manter revisao rigorosa |

## 6. Proximas issues recomendadas

### 6.1 Plan removal or type extraction for legacy owner-only finance helpers

Objetivo:

- separar tipos compartilhados de `lib/finance/server.ts` e `lib/finance/banks-server.ts`;
- reduzir dependencia nominal desses arquivos;
- preparar remocao futura de helpers owner-only.

### 6.2 Audit admin and permissions for multi-organization access

Objetivo:

- auditar `lib/finance/admin-server.ts`;
- auditar `lib/finance/access-control.ts`;
- mapear impacto em `profiles`, `user_module_permissions` e `user_feature_permissions`.

### 6.3 Implement first gated RLS integration test for expense_categories

Objetivo:

- usar harness gated;
- usar ambiente dedicado `RLS_TEST_*`;
- provar isolamento real com usuario autenticado comum;
- manter skip seguro quando ambiente nao estiver configurado.

## 7. Fora de escopo desta auditoria

Esta auditoria nao altera:

- codigo de producao;
- RLS;
- migrations;
- rotas;
- billing;
- schema;
- `owner_id`;
- `organization_id NOT NULL`.

## 8. Conclusao

Nao ha gambiarra ativa evidente no estado atual da `main`.

O que existe sao dividas tecnicas transicionais conhecidas e documentadas. A mais importante antes de RLS real e separar o que ainda depende de helpers owner-only e continuar evoluindo o harness para testes reais gated, sem usar service role como prova de seguranca.
