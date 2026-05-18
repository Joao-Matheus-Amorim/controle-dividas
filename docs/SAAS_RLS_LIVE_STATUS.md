# SaaS RLS Live Status

Issue: #224

## 1. Objetivo

Este documento registra o estado vivo atual da transicao SaaS multi-tenant do FamilyFinance apos a conclusao do bloco principal de RLS financeira.

Ele complementa o `README.md` sem apagar o historico e sem substituir documentos PMBOK ja existentes.

## 2. Estado atual resumido

O projeto esta em modo:

```txt
SaaS multi-tenant transicional com RLS financeira principal aplicada.
```

Isso significa:

- `organizations` e `organization_memberships` existem;
- `organization_id` existe nas tabelas principais;
- principais modulos financeiros usam organization-aware queries/actions;
- RLS financeira principal ja foi migrada para organization-aware com fallback legado;
- `owner_id` ainda existe e continua sendo usado como compatibilidade;
- `organization_id` ainda e nullable;
- rotas por `orgSlug` ainda nao existem;
- billing/Stripe ainda nao foi implementado.

## 3. Migrations SaaS/RLS atuais

As migrations relevantes para SaaS/RLS ja aplicadas/mergeadas sao:

```txt
006_organizations_memberships.sql
007_add_organization_id_columns.sql
008_expense_categories_organization_rls.sql
009_expense_categories_owner_write_rls.sql
010_family_members_organization_rls.sql
011_expenses_organization_rls.sql
012_payable_bills_organization_rls.sql
013_receivable_incomes_organization_rls.sql
014_banks_organization_rls.sql
015_profiles_organization_rls.sql
016_user_module_permissions_organization_rls.sql
017_user_feature_permissions_organization_rls.sql
```

## 4. RLS financeira principal

Tabelas ja cobertas por RLS organization-aware:

- `expense_categories`;
- `family_members`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`.

Tabelas de identidade/permissao ja cobertas por RLS organization-aware transicional:

- `profiles`;
- `user_module_permissions`;
- `user_feature_permissions`.

Padrao aplicado:

```txt
Leitura:
organization_id com membership
OU legado organization_id IS NULL + owner_id

Escrita:
owner da linha durante transicao
```

Observacoes importantes:

- `expense_categories` precisou de hotfix de escrita na migration `009`;
- `banks` preserva comportamento historico e nao depende de `family_members.is_active` na RLS;
- nenhuma dessas migrations remove `owner_id`;
- nenhuma torna `organization_id NOT NULL`.

## 5. Testes RLS gated versionados

Ja existem testes RLS gated versionados no repositorio para:

- `expense_categories`;
- `category-owner-scope`;
- `family_members`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`.
- `profiles`;
- `user_module_permissions`;
- `user_feature_permissions`.

Os testes RLS gated versionados rodam somente quando o ambiente dedicado esta configurado:

```txt
RUN_RLS_TESTS=true
RLS_TEST_SUPABASE_URL
RLS_TEST_SUPABASE_ANON_KEY
RLS_TEST_SUPABASE_SERVICE_ROLE_KEY
RLS_TEST_USER_A_EMAIL
RLS_TEST_USER_A_PASSWORD
RLS_TEST_USER_B_EMAIL
RLS_TEST_USER_B_PASSWORD
```

No CI comum, sem `RUN_RLS_TESTS=true`, as suites reais ficam desativadas para nao tocar Supabase externo.

## 6. Validacao operacional recente

O bloco RLS financeiro foi validado com:

- `npm run lint`;
- `npm run build`;
- `npm run test`;
- testes RLS gated versionados no Supabase de teste;
- migrations aplicadas manualmente no ambiente de teste antes dos merges.

Validacao recente informada:

```txt
35 arquivos de teste passaram
129 testes passaram
```

## 7. O que ainda nao esta pronto

Ainda nao foi feito:

- admin multi-org pleno;
- UX de organization ativa;
- rotas por `orgSlug`;
- billing/Stripe;
- `organization_id NOT NULL`;
- remocao de `owner_id`.

## 8. Proximos passos recomendados

Ordem segura:

1. auditar e endurecer admin/permissoes para gravar e filtrar `organization_id`;
2. criar guardas unitarios para migrations RLS recentes quando faltarem;
3. planejar UX de organization ativa;
4. so depois pensar em rotas por `orgSlug`;
5. billing apenas depois de isolamento/UX estarem maduros;
6. `organization_id NOT NULL` e remocao de `owner_id` apenas em gate futuro.

## 9. Regra de manutencao

Daqui para frente, o README deve ser atualizado de forma enxuta e apontar para este documento quando o assunto for status SaaS/RLS.

Evitar duplicar longos blocos de plano no README.
