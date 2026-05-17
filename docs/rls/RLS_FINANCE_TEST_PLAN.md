# Finance RLS Test Plan

Issue: #155

## 1. Objetivo

Este documento define a matriz de testes necessaria antes de implementar RLS financeira multi-tenant.

Ele complementa:

- `docs/FINANCIAL_RLS_MULTI_TENANT_PLAN.md`
- `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`
- `docs/rls/ORGANIZATION_MEMBERSHIP_RLS_HELPERS.md`
- `docs/rls/LEGACY_ORGANIZATION_ID_HANDLING.md`
- `docs/rls/RLS_ROLLOUT_AND_ROLLBACK.md`

Esta PR nao implementa testes e nao altera RLS.

## 2. Principios

Os testes de RLS devem provar isolamento real no banco.

Principios obrigatorios:

- testar usuario autenticado comum;
- nao usar service role como unica prova;
- cobrir leitura e escrita;
- cobrir organization A vs organization B;
- cobrir registros legados `organization_id IS NULL` enquanto o fallback existir;
- cobrir tentativa de relacionar IDs de outra organization;
- rodar antes de cada migration RLS futura;
- manter PRs pequenas.

## 3. Personas de teste

### 3.1 Usuario A

- auth user pertencente a organization A;
- deve acessar dados da organization A;
- nao deve acessar dados da organization B.

### 3.2 Usuario B

- auth user pertencente a organization B;
- deve acessar dados da organization B;
- nao deve acessar dados da organization A.

### 3.3 Usuario multi-org

- auth user membro de organization A e B;
- deve acessar conforme membership e contexto esperado;
- precisa de regra clara quando UX de organization ativa existir.

### 3.4 Usuario sem membership

- auth user autenticado sem membership ativa;
- nao deve acessar dados financeiros de nenhuma organization.

### 3.5 Service role/admin client

- pode ser usado para setup de fixtures;
- nao deve ser usado como prova de isolamento RLS;
- pode mascarar falhas por contornar RLS.

## 4. Fixtures minimas

Cada suite de RLS deve preparar:

- organization A;
- organization B;
- membership ativa para usuario A na organization A;
- membership ativa para usuario B na organization B;
- registros com `organization_id` A;
- registros com `organization_id` B;
- registros legados `organization_id IS NULL`, enquanto o fallback existir;
- relacionamentos de member/category por organization.

## 5. Matriz geral de cenarios

| Cenario | Esperado |
| --- | --- |
| Usuario A le dado da organization A | permitido |
| Usuario A le dado da organization B | negado |
| Usuario B le dado da organization A | negado |
| Usuario sem membership le dado financeiro | negado |
| Usuario A insere dado com organization A | permitido |
| Usuario A insere dado com organization B | negado |
| Usuario A atualiza dado da organization A | permitido conforme regra |
| Usuario A atualiza dado da organization B | negado |
| Usuario A deleta dado da organization B | negado |
| Registro legado `organization_id IS NULL` | segue fallback documentado |
| Service role acessa dados | nao prova seguranca |

## 6. Matriz por tabela

### 6.1 `family_members`

Testes minimos:

- membro da organization A visivel para usuario A;
- membro da organization B invisivel para usuario A;
- insert com `organization_id` A permitido para usuario A conforme regra;
- insert com `organization_id` B negado para usuario A;
- update de membro da organization B negado para usuario A;
- legado `organization_id IS NULL` permitido apenas pelo fallback definido.

### 6.2 `expense_categories`

Testes minimos:

- categoria da organization A visivel para usuario A;
- categoria da organization B invisivel para usuario A;
- insert com organization A permitido conforme regra;
- insert com organization B negado;
- update/delete de categoria de outra organization negado;
- legado permitido apenas pelo fallback definido.

### 6.3 `expenses`

Testes minimos:

- gasto da organization A visivel para usuario A;
- gasto da organization B invisivel para usuario A;
- insert com organization A permitido;
- insert com organization B negado;
- update/delete de gasto da organization B negado;
- tentativa de usar `family_member_id` de outra organization bloqueada pela aplicacao e/ou futuro hardening;
- tentativa de usar `category_id` de outra organization bloqueada pela aplicacao e/ou futuro hardening;
- legado permitido apenas pelo fallback definido.

### 6.4 `payable_bills`

Testes minimos:

- conta a pagar da organization A visivel para usuario A;
- conta a pagar da organization B invisivel para usuario A;
- insert com organization A permitido;
- insert com organization B negado;
- update/status/delete de outra organization negado;
- tentativa de usar `responsible_member_id` de outra organization bloqueada pela aplicacao e/ou futuro hardening;
- legado permitido apenas pelo fallback definido.

### 6.5 `receivable_incomes`

Testes minimos:

- conta a receber da organization A visivel para usuario A;
- conta a receber da organization B invisivel para usuario A;
- insert com organization A permitido;
- insert com organization B negado;
- update/status/delete de outra organization negado;
- tentativa de usar `receiver_member_id` de outra organization bloqueada pela aplicacao e/ou futuro hardening;
- legado permitido apenas pelo fallback definido.

### 6.6 `banks`

Testes minimos:

- banco da organization A visivel para usuario A;
- banco da organization B invisivel para usuario A;
- insert com organization A permitido;
- insert com organization B negado;
- update/saldo/delete de outra organization negado;
- tentativa de usar `family_member_id` de outra organization bloqueada pela aplicacao e/ou futuro hardening;
- banco vinculado a membro inativo continua visivel se pertence a organization permitida;
- legado permitido apenas pelo fallback definido.

### 6.7 `profiles`

Testes minimos:

- usuario le perfil permitido da propria organization conforme regra;
- usuario nao le perfil de organization sem membership;
- admin/owner gerencia perfis da propria organization;
- admin/owner nao gerencia perfis de outra organization;
- legado tratado conforme decisao especifica.

### 6.8 `user_module_permissions`

Testes minimos:

- usuario/admin le permissoes da organization permitida conforme regra;
- usuario nao le permissoes de outra organization;
- admin/owner altera permissoes da propria organization;
- admin/owner nao altera permissoes de outra organization;
- service role nao deve ser unica validacao.

### 6.9 `user_feature_permissions`

Testes minimos:

- usuario/admin le feature permissions da organization permitida conforme regra;
- usuario nao le feature permissions de outra organization;
- admin/owner altera feature permissions da propria organization;
- admin/owner nao altera feature permissions de outra organization.

## 7. Testes de legado

Enquanto houver fallback para `organization_id IS NULL`, cada tabela com legado deve ter teste especifico:

- usuario owner antigo consegue ler legado proprio;
- outro usuario nao consegue ler legado alheio;
- update de legado preenche `organization_id`, quando a aplicacao fizer esse fluxo;
- insert novo nao cria legado;
- delete legado segue regra temporaria documentada.

Quando o fallback for removido, esses testes devem ser substituidos por testes que confirmem ausencia de registros legados.

## 8. Testes de dashboard e relatorios

Apos cada migration RLS futura, validar:

- dashboard mostra apenas dados da organization permitida;
- relatorios mostram apenas dados da organization permitida;
- dados de outra organization nao entram em agregados;
- bancos de membros inativos continuam visiveis quando pertencem a organization permitida;
- registros legados seguem fallback documentado.

## 9. Ambiente e client de teste

Plano recomendado:

- usar service role apenas para criar fixtures;
- executar consultas de validacao com client autenticado comum;
- criar tokens/sessoes equivalentes a usuarios A/B;
- limpar dados de teste apos execucao;
- evitar depender de dados reais do ambiente operacional.

## 10. Ordem de implementacao dos testes

Antes da primeira migration RLS:

1. criar fixtures de organizations A/B;
2. criar helpers de teste para client autenticado comum;
3. criar testes de leitura para tabela base de menor risco;
4. criar testes de escrita para a mesma tabela;
5. expandir por tabela conforme rollout.

Ordem sugerida:

1. `expense_categories`;
2. `family_members`;
3. `expenses`;
4. `payable_bills`;
5. `receivable_incomes`;
6. `banks`;
7. `profiles` e permissoes.

## 11. Criterios de aceite para PR futura de testes

Cada PR futura de testes RLS deve declarar:

- tabela coberta;
- usuarios/organizations usados;
- operacoes testadas;
- comportamento esperado para legado;
- se usa service role apenas para fixture;
- como prova que usuario comum foi usado;
- que nenhuma migration RLS foi misturada, salvo se for a PR intencional de migration + teste.

## 12. Fora de escopo

Este documento nao implementa:

- testes;
- migrations;
- policies;
- helpers SQL;
- codigo de producao;
- rotas;
- billing;
- `organization_id NOT NULL`;
- remocao de `owner_id`.

## 13. Conclusao

A primeira migration de RLS financeira so deve avancar depois de existir cobertura minima de testes reais de RLS para pelo menos a primeira tabela alvo.

Os testes de actions e guards ja existentes reduzem risco na aplicacao, mas nao substituem testes de RLS executados com usuario autenticado comum.
