# RLS Rollout and Rollback Strategy

Issue: #154

## 1. Objetivo

Este documento define uma estrategia segura para rollout e rollback das futuras mudancas de RLS financeira multi-tenant.

Ele complementa:

- `docs/FINANCIAL_RLS_MULTI_TENANT_PLAN.md`
- `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`
- `docs/rls/ORGANIZATION_MEMBERSHIP_RLS_HELPERS.md`
- `docs/rls/LEGACY_ORGANIZATION_ID_HANDLING.md`

Esta PR nao cria migration, nao altera policy e nao altera codigo de producao.

## 2. Principios

RLS financeira nao deve ser aplicada em uma unica PR grande.

Principios obrigatorios:

- PRs pequenas;
- uma tabela ou grupo pequeno por PR;
- rollback documentado no corpo de cada PR;
- validacao antes e depois da mudanca;
- CI verde;
- revisao de seguranca antes de merge;
- nenhuma alteracao simultanea de RLS, rotas, billing ou `organization_id NOT NULL`.

## 3. Pre-condicoes

Antes da primeira migration de RLS financeira, confirmar:

- inventario atual de RLS concluido;
- design de helpers revisado;
- estrategia para legado `organization_id IS NULL` definida;
- matriz de testes RLS planejada;
- ambiente de teste/staging disponivel;
- backfill conhecido no ambiente alvo;
- consultas de validacao preparadas;
- rollback escrito.

## 4. Ordem sugerida de rollout

### Fase 0 - Preparacao

Sem migration de RLS.

Entregas:

- inventario atual;
- helper design;
- estrategia legada;
- rollout/rollback;
- plano de testes RLS.

### Fase 1 - Tabelas base

Candidatas:

- `expense_categories`;
- `family_members`.

Motivo:

- sao base para os modulos financeiros;
- precisam funcionar antes das tabelas dependentes;
- devem ser testadas com registros legados e registros com organization.

### Fase 2 - Tabelas financeiras de transacao

Aplicar em PRs separadas:

- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`.

Cuidado:

- cada tabela deve ter validacao de leitura e escrita;
- bancos precisam preservar contas historicas de membros inativos;
- gastos dependem de `family_member_id` e `category_id`.

### Fase 3 - Perfis e permissoes

Candidatas:

- `profiles`;
- `user_module_permissions`;
- `user_feature_permissions`.

Motivo para deixar depois:

- ainda sao mais owner-centric;
- impactam autorizacao visual e funcional do app inteiro;
- podem precisar de regras diferentes para usuario comum, admin e owner.

### Fase 4 - Remocao de fallback legado

Nao fazer junto com as primeiras RLS.

So considerar depois de:

- backfill completo;
- zero registros `organization_id IS NULL` confirmados;
- testes RLS passando;
- issue explicita;
- rollback definido.

### Fase 5 - `organization_id NOT NULL` e possivel remocao de `owner_id`

Nao fazer nesta etapa.

Esse gate deve vir apenas depois de RLS, rotas/UX e dados legados estarem estabilizados.

## 5. Modelo de PR futura de RLS

Cada PR futura deve declarar:

- tabela(s) afetada(s);
- regra atual;
- regra nova;
- helpers usados;
- tratamento de legado;
- testes adicionados ou executados;
- validacao pre-mudanca;
- validacao pos-mudanca;
- rollback;
- fora de escopo.

## 6. Checklist pre-migration

Antes de aplicar uma migration RLS:

```txt
[ ] Confirmar tabela alvo
[ ] Confirmar policies atuais
[ ] Confirmar helpers usados
[ ] Confirmar existencia de organization_id na tabela
[ ] Confirmar dados legados organization_id IS NULL
[ ] Confirmar comportamento esperado para legado
[ ] Confirmar testes existentes
[ ] Adicionar testes faltantes
[ ] Escrever rollback
[ ] Validar que nao ha mudanca de rotas/billing/schema destrutivo
```

## 7. Validacoes pre-migration

Antes de cada migration, validar:

- contagem por `organization_id`;
- quantidade de registros `organization_id IS NULL`;
- distribuicao de legados por `owner_id`;
- existencia de registros de outras organizations;
- existencia de membros/categorias relacionados.

Essas consultas devem ser escritas no corpo da PR futura de migration, com tabela especifica.

## 8. Validacoes pos-migration

Depois de cada migration, validar com usuario autenticado comum:

- usuario da organization A le dados da A;
- usuario da organization A nao le dados da B;
- usuario sem membership nao le dados protegidos;
- registro legado segue fallback definido;
- insert novo exige `organization_id` valido;
- dashboard e relatorios continuam funcionando.

## 9. Rollback minimo por PR

Cada PR de migration deve incluir rollback concreto.

Rollback minimo esperado:

- nome das policies novas;
- como remover policies novas;
- como restaurar policies anteriores, se necessario;
- criterio para pausar rollout;
- validacao depois do rollback.

O rollback real deve ser especifico da tabela e da operacao.

## 10. Criterios de parada

Parar rollout se qualquer item acontecer:

- usuario de organization A enxerga dado da organization B;
- usuario perde acesso a dados da propria organization sem motivo;
- registros legados somem antes da decisao de remover fallback;
- dashboard ou relatorios quebram;
- migration exige mudanca de rotas, billing ou schema destrutivo;
- CI falha;
- revisao aponta risco de recursao RLS.

## 11. Service role e testes

Nao usar service role como unica prova de que RLS esta correta.

Service role pode contornar RLS e mascarar erro.

Validacoes devem incluir usuario autenticado comum usando contexto equivalente ao client anon/autenticado.

## 12. Fora de escopo

Este documento nao implementa:

- migration;
- policy;
- helper SQL;
- teste novo;
- codigo de producao;
- rotas;
- billing;
- `organization_id NOT NULL`;
- remocao de `owner_id`.

## 13. Conclusao

A estrategia segura e aplicar RLS financeira em etapas pequenas, com rollback por PR e validacao real de usuario autenticado.

A primeira migration de RLS so deve ser aberta depois da matriz de testes RLS estar planejada e revisada.
