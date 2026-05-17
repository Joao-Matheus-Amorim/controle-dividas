# Legacy organization_id Handling for RLS

Issue: #153

## 1. Objetivo

Este documento define a estrategia para tratar registros legados com `organization_id IS NULL` durante a futura migracao de RLS financeira para multi-tenant.

Ele complementa:

- `docs/FINANCIAL_RLS_MULTI_TENANT_PLAN.md`
- `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`
- `docs/rls/ORGANIZATION_MEMBERSHIP_RLS_HELPERS.md`

Esta PR nao altera migrations, policies, helpers SQL ou codigo de producao.

## 2. Contexto

A migration `007_add_organization_id_columns.sql` adicionou `organization_id` nullable em tabelas existentes, mas nao fez backfill e nao alterou RLS.

A aplicacao opera no padrao transicional:

```txt
owner_id + (organization_id atual OR organization_id IS NULL)
```

Esse padrao evita quebrar registros antigos enquanto o SaaS multi-tenant e endurecido em etapas.

## 3. Principio de seguranca

Registros com `organization_id IS NULL` nunca devem ser tratados como publicos ou globais.

Durante a fase transicional, qualquer fallback para legado precisa continuar amarrado a um escopo seguro, preferencialmente:

```txt
owner_id = auth.uid()
```

ou outra regra equivalente e explicitamente documentada.

Nunca permitir:

```txt
organization_id IS NULL sem owner_id seguro
```

## 4. Estrategia recomendada para primeira RLS financeira

A primeira fase de RLS financeira pode usar policies temporarias com duas rotas:

1. registros novos com `organization_id` preenchido;
2. registros legados com `organization_id IS NULL` e fallback por `owner_id`.

Modelo conceitual para select:

```sql
using (
  public.is_organization_member(organization_id)
  or (
    organization_id is null
    and owner_id = auth.uid()
  )
)
```

Modelo conceitual para insert:

```sql
with check (
  public.is_organization_member(organization_id)
)
```

Observacao: inserts novos nao devem depender do fallback legado. Os gates anteriores ja adicionaram guarda para que os fluxos de criacao gravem `organization_id`.

## 5. Diferenca entre leitura e escrita

### 5.1 Leitura

Leitura pode aceitar fallback legado temporario se:

- o registro tem `organization_id IS NULL`;
- o registro pertence ao `owner_id` do usuario autenticado;
- a tabela ainda pode conter dados legados em algum ambiente.

### 5.2 Insert

Insert novo deve exigir `organization_id` valido.

Nao recomendar fallback legado em insert.

### 5.3 Update

Update durante fase transicional deve:

- permitir atualizar registro da organization ativa;
- permitir atualizar registro legado apenas pelo owner seguro;
- preencher `organization_id` com a organization ativa quando a aplicacao fizer update de registro legado.

Modelo conceitual:

```sql
using (
  public.is_organization_member(organization_id)
  or (
    organization_id is null
    and owner_id = auth.uid()
  )
)
with check (
  public.is_organization_member(organization_id)
)
```

Cuidado: se `with check` exigir organization preenchida, updates de registros legados precisam realmente preencher `organization_id`. Isso ja foi feito nos fluxos principais, mas deve ser validado por tabela antes da migration.

### 5.4 Delete

Delete deve usar `USING`, sem `WITH CHECK`.

Delete durante fase transicional pode seguir regra semelhante a leitura/update no lado `USING`:

```sql
using (
  public.is_organization_member(organization_id)
  or (
    organization_id is null
    and owner_id = auth.uid()
  )
)
```

A decisao de exigir admin/owner da organization para delete deve ser definida por tabela.

Importante: `WITH CHECK` nao se aplica a policies `FOR DELETE`.

## 6. Tabelas e tratamento recomendado

### 6.1 `family_members`

Tratamento transicional:

- select legado permitido por `owner_id`;
- update legado permitido por `owner_id`, com aplicacao preenchendo `organization_id`;
- insert novo exige organization.

Risco:

- tabela base para despesas, bancos e permissoes;
- qualquer erro pode ocultar dados do dashboard.

### 6.2 `expense_categories`

Tratamento transicional:

- select legado permitido por `owner_id`;
- update legado permitido por `owner_id`, preenchendo `organization_id`;
- insert novo exige organization.

Risco:

- categorias legadas podem ser usadas por gastos;
- categorias default precisam de regra clara.

### 6.3 `expenses`

Tratamento transicional:

- select legado permitido por `owner_id`;
- update legado permitido por `owner_id`, preenchendo `organization_id`;
- insert novo exige organization.

Risco:

- deve continuar validando `family_member_id` e `category_id` por organization na aplicacao;
- RLS inicial pode nao validar FKs cruzadas por organization, mas isso deve entrar em hardening futuro.

### 6.4 `payable_bills`

Tratamento transicional:

- select legado permitido por `owner_id`;
- update/status legado permitido por `owner_id`, preenchendo `organization_id`;
- insert novo exige organization.

Risco:

- `responsible_member_id` precisa continuar validado na aplicacao.

### 6.5 `receivable_incomes`

Tratamento transicional:

- select legado permitido por `owner_id`;
- update/status legado permitido por `owner_id`, preenchendo `organization_id`;
- insert novo exige organization.

Risco:

- `receiver_member_id` precisa continuar validado na aplicacao.

### 6.6 `banks`

Tratamento transicional:

- select legado permitido por `owner_id`;
- update/saldo legado permitido por `owner_id`, preenchendo `organization_id`;
- insert novo exige organization.

Risco:

- bancos sao historicos;
- nao ocultar registros por membro inativo;
- manter testes de listagem historica.

### 6.7 `profiles` e permissoes

Tratamento transicional:

- manter cautela maior;
- admin/permissoes ainda sao owner-centric;
- nao migrar em conjunto com tabelas financeiras de alto volume sem plano dedicado.

Risco:

- permissao errada pode expor ou ocultar modulos inteiros.

## 7. Condicoes para remover suporte legado

Remover fallback `organization_id IS NULL` apenas quando todos os pontos abaixo forem verdadeiros:

- backfill validado em todos os ambientes;
- queries confirmam zero registros legados por tabela;
- CI cobre inserts com `organization_id`;
- actions cobrem update de legados preenchendo `organization_id`;
- testes cross-tenant passam;
- RLS por organization esta validada;
- rollback documentado;
- issue/PR explicita aprovada para remover fallback.

## 8. Queries de validacao recomendadas

Antes de remover fallback, executar consultas por tabela:

```sql
select count(*) from public.family_members where organization_id is null;
select count(*) from public.expense_categories where organization_id is null;
select count(*) from public.expenses where organization_id is null;
select count(*) from public.payable_bills where organization_id is null;
select count(*) from public.receivable_incomes where organization_id is null;
select count(*) from public.banks where organization_id is null;
select count(*) from public.profiles where organization_id is null;
select count(*) from public.user_module_permissions where organization_id is null;
select count(*) from public.user_feature_permissions where organization_id is null;
```

Tambem validar distribuicao por owner para legados restantes:

```sql
select owner_id, count(*)
from public.expenses
where organization_id is null
group by owner_id;
```

Repetir o padrao nas demais tabelas antes do corte.

## 9. Rollback da estrategia legada

Se a primeira migration RLS bloquear dados legados indevidamente:

1. pausar rollout;
2. identificar tabela/policy afetada;
3. dropar policy nova;
4. restaurar policy owner-centric anterior, se necessario;
5. validar acesso aos registros legados;
6. corrigir plano antes de nova tentativa.

Toda migration futura precisa declarar comandos de rollback concretos no corpo da PR.

## 10. Fora de escopo

Este documento nao implementa:

- migration;
- policy;
- helper SQL;
- backfill;
- `organization_id NOT NULL`;
- remocao de `owner_id`;
- rotas `[orgSlug]`;
- billing;
- alteracao de UI.

## 11. Conclusao

A estrategia mais segura e manter fallback legado temporario em leitura/update/delete, sempre amarrado a `owner_id`, enquanto inserts novos exigem `organization_id`.

A remocao desse fallback deve ser um gate futuro separado, depois de backfill completo e validado em todos os ambientes.
