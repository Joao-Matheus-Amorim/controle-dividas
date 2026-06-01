# RLS Test Harness

Issue: #164

> Status DocDoc: Parcialmente superado
> Uso seguro: contexto do desenho inicial do harness de testes RLS.
> Superado por / observacao: confirmar implementacao atual em
> `__tests__/integration/rls`, workflows e `docs/VALIDACAO_TECNICA.md`.

## 1. Objetivo

Este documento define a base tecnica para criar testes reais de RLS financeira multi-tenant sem misturar, nesta etapa, migrations ou alteracoes de policies.

Ele complementa:

- `docs/rls/RLS_FINANCE_TEST_PLAN.md`
- `docs/rls/RLS_ROLLOUT_AND_ROLLBACK.md`
- `docs/rls/LEGACY_ORGANIZATION_ID_HANDLING.md`
- `docs/rls/ORGANIZATION_MEMBERSHIP_RLS_HELPERS.md`

Esta PR nao implementa testes automatizados reais de RLS e nao altera RLS.

## 2. Por que nao ligar testes reais de RLS direto no CI agora

Testes reais de RLS precisam de:

- projeto Supabase de teste ou ambiente isolado;
- usuarios autenticados reais ou tokens validos;
- service role apenas para setup/cleanup;
- dados de fixture descartaveis;
- garantia de que nenhum dado operacional sera usado;
- pipeline que nao mascare falhas por usar apenas service role.

Como o CI atual roda Vitest localmente com mocks/MSW e variaveis de ambiente, ligar testes reais contra um Supabase sem desenho de isolamento pode gerar:

- flakiness;
- vazamento de dados de teste;
- dependencia de ambiente externo;
- falso positivo se service role for usado para validar acesso;
- risco de tocar dados operacionais.

Por isso, o primeiro passo seguro e definir o harness antes da implementacao.

## 3. Separacao de responsabilidades

### 3.1 Service role

Uso permitido:

- criar organizations de teste;
- criar usuarios/perfis de teste quando necessario;
- criar registros financeiros de fixture;
- limpar fixtures apos o teste.

Uso proibido como prova de seguranca:

- validar se usuario A acessa ou nao dados da organization B;
- validar policies RLS;
- validar isolamento final.

### 3.2 Cliente autenticado comum

Uso obrigatorio:

- executar leituras protegidas por RLS;
- executar inserts/updates/deletes protegidos por RLS;
- provar que usuario sem membership nao acessa dados;
- provar que usuario de organization A nao acessa dados da organization B.

## 4. Ambiente recomendado

Criar um ambiente dedicado de teste RLS, separado do ambiente operacional.

Variaveis sugeridas para futuras suites:

```txt
RLS_TEST_SUPABASE_URL
RLS_TEST_SUPABASE_ANON_KEY
RLS_TEST_SUPABASE_SERVICE_ROLE_KEY
RLS_TEST_USER_A_EMAIL
RLS_TEST_USER_A_PASSWORD
RLS_TEST_USER_B_EMAIL
RLS_TEST_USER_B_PASSWORD
```

Essas variaveis nao devem apontar para dados operacionais.

## 5. Estrutura de arquivos sugerida

```txt
__tests__/integration/rls/
  helpers.ts
  expense-categories.rls.test.ts
  family-members.rls.test.ts
  expenses.rls.test.ts
  payable-bills.rls.test.ts
  receivable-incomes.rls.test.ts
  banks.rls.test.ts
```

Ou, se os testes reais precisarem ficar fora do `npm run test` padrao:

```txt
__tests__/rls/
  helpers.ts
  *.rls.test.ts
```

Nesse caso, adicionar script separado no futuro, por exemplo:

```txt
npm run test:rls
```

Nao adicionar esse script antes do ambiente estar preparado.

## 6. Helper conceitual de fixture

O helper futuro deve oferecer funcoes como:

```txt
createRlsTestContext()
cleanupRlsTestContext(context)
createAuthenticatedClientForUserA(context)
createAuthenticatedClientForUserB(context)
createServiceRoleFixtureClient(context)
```

O contexto deve conter:

- organization A;
- organization B;
- usuario A;
- usuario B;
- memberships;
- IDs de fixtures criadas;
- prefixo unico de teste para cleanup seguro.

## 7. Padrao de isolamento de dados de teste

Cada execucao deve usar prefixo unico, por exemplo:

```txt
rls_test_<timestamp>_<random>
```

Esse prefixo deve ser usado em slugs, nomes e descricoes de fixtures.

Cleanup deve remover apenas dados com esse prefixo.

Nunca limpar por condicoes amplas como:

```txt
status = test
```

sem prefixo unico.

## 8. Fluxo recomendado de teste

1. Service role cria fixtures.
2. Usuario A autentica com client comum.
3. Usuario B autentica com client comum.
4. Usuario A tenta ler dados da organization A.
5. Usuario A tenta ler dados da organization B.
6. Usuario B tenta ler dados da organization A.
7. Usuario sem membership tenta ler dados protegidos, quando aplicavel.
8. Teste valida resultados.
9. Service role limpa fixtures pelo prefixo unico.

## 9. Primeiro alvo recomendado

Primeira tabela recomendada para teste RLS real:

```txt
expense_categories
```

Motivos:

- menor risco que tabelas transacionais;
- tabela simples;
- nao depende diretamente de `family_member_id`;
- boa para validar leitura e insert por organization.

Depois:

1. `family_members`;
2. `expenses`;
3. `payable_bills`;
4. `receivable_incomes`;
5. `banks`;
6. `profiles` e permissoes.

## 10. Gatilhos para pular testes RLS no CI padrao

Enquanto o ambiente dedicado nao existir, testes RLS reais devem ser protegidos por flag, por exemplo:

```txt
RUN_RLS_TESTS=true
```

Se a flag nao estiver ativa, a suite RLS deve ser ignorada ou nao incluída no `npm run test` padrao.

Isso evita quebrar CI comum por falta de ambiente externo.

## 11. Criterios para implementar o harness executavel

Antes de criar testes RLS executaveis, confirmar:

- ambiente Supabase dedicado;
- variaveis de teste configuradas no CI;
- usuarios de teste descartaveis;
- cleanup seguro;
- script separado ou flag clara;
- documentacao de como rodar localmente;
- nenhum uso de dados reais.

## 12. Fora de escopo

Este documento nao implementa:

- testes reais;
- migration;
- policy;
- helper SQL;
- alteracao em codigo de producao;
- alteracao em CI;
- rotas;
- billing;
- `organization_id NOT NULL`;
- remocao de `owner_id`.

## 13. Conclusao

O harness RLS deve ser implementado em etapas.

Primeiro, preparar ambiente e helpers de fixture com service role apenas para setup/cleanup. Depois, validar isolamento com clientes autenticados comuns. So entao abrir a primeira PR de migration RLS financeira.
