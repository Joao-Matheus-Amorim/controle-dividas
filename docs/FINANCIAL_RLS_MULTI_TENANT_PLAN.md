# Financial RLS Multi-Tenant Plan

## 1. Objetivo

Este documento planeja a futura migracao das policies RLS das tabelas financeiras para um modelo SaaS multi-tenant baseado em `organization_id` e membership.

Esta PR e este documento **nao implementam RLS**.

O objetivo e reduzir risco antes de qualquer migration futura, deixando claro:

- estado atual confirmado;
- helpers SQL existentes;
- policies futuras desejadas;
- tratamento de legado `organization_id IS NULL`;
- ordem segura de rollout;
- rollback;
- matriz de testes necessaria.

Readiness atual do Gate 4:

- `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md` inventaria as policies existentes;
- `docs/audits/FINANCIAL_RLS_GATE4_READINESS.md` registra pre-condicoes, helpers, alvo inicial recomendado e criterio para o primeiro PR de migration.

## 2. Estado atual confirmado

### 2.1 Migration 006

A migration `006_organizations_memberships.sql` criou:

- `organizations`;
- `organization_memberships`;
- indices basicos;
- RLS nas duas novas tabelas;
- helpers SQL nao recursivos;
- policies basicas para organizations e memberships.

Helpers existentes:

```txt
public.current_user_organization_ids()
public.is_organization_member(target_organization_id uuid)
public.is_organization_admin(target_organization_id uuid)
```

Caracteristicas importantes:

- usam `security definer`;
- usam `set search_path = public`;
- consultam `organization_memberships` internamente;
- foram criados para evitar policies recursivas em `organization_memberships`.

Ponto de cuidado: nao recriar policies em `organization_memberships` que consultem diretamente a propria tabela no `using`, pois isso pode reabrir erro de recursao.

### 2.2 Migration 007

A migration `007_add_organization_id_columns.sql` adicionou `organization_id` nullable nas tabelas existentes:

- `profiles`;
- `family_members`;
- `expense_categories`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`;
- `user_module_permissions`;
- `user_feature_permissions`.

A migration tambem adicionou indices por `organization_id`.

Ela foi intencionalmente nao destrutiva:

- nao fez backfill;
- nao alterou RLS financeira;
- nao removeu `owner_id`;
- nao tornou `organization_id` `NOT NULL`;
- nao alterou queries ou Server Actions.

## 3. Estado funcional antes da RLS financeira

Os gates anteriores ja foram concluidos:

- Gate 1: auditoria de queries/actions `owner_id` only;
- Gate 2: testes cross-tenant dos vinculos financeiros criticos;
- Gate 3: guarda para inserts com `organization_id`.

Coberturas relevantes ja existentes:

- `family_member_id` em gastos;
- `category_id` em gastos;
- `responsible_member_id` em contas a pagar;
- `receiver_member_id` em contas a receber;
- `family_member_id` em bancos;
- listagem de bancos preservando membros inativos;
- inserts com `organization_id` em `family_members`, `expense_categories`, `expenses`, `payable_bills`, `receivable_incomes` e `banks`.

## 4. Principio transicional que deve continuar valendo

A aplicacao ainda usa o padrao:

```txt
owner_id + (organization_id atual OR organization_id IS NULL)
```

Esse padrao deve ser considerado na primeira fase de RLS financeira para evitar quebra de registros legados.

Nao devemos fazer agora:

- remover `owner_id`;
- tornar `organization_id` `NOT NULL`;
- remover compatibilidade com `organization_id IS NULL` sem validacao completa;
- alterar rotas para `[orgSlug]`;
- implementar billing.

## 5. Tabelas candidatas e direcao de policy

### 5.1 `profiles`

Uso atual:

- representa usuarios/perfis familiares;
- ainda depende de `owner_id`;
- recebeu `organization_id` nullable.

Direcao futura:

- leitura por membros/admins da organization;
- escrita administrativa limitada a admins/owners da organization;
- preservar fallback legado ate backfill completo.

Risco:

- admin familiar atual ainda e owner-centric;
- precisa de hardening multi-org antes de remover fallback.

### 5.2 `family_members`

Uso atual:

- modulo Pessoas ja e organization-aware;
- inserts gravam `organization_id`;
- membros legados `organization_id IS NULL` ainda sao aceitos.

Direcao futura:

- select permitido para members da organization;
- insert/update/delete restrito por role administrativa ou regras de permissao;
- primeira RLS pode aceitar legado com `owner_id = auth.uid()` ou via perfil owner, se documentado.

Risco:

- membros sao base para gastos, contas, bancos e permissoes;
- alterar primeiro sem testes pode quebrar todo dashboard.

### 5.3 `expense_categories`

Uso atual:

- categorias ja usam organization ativa ou legado;
- inserts gravam `organization_id`.

Direcao futura:

- select por membership da organization;
- insert/update/delete por admins ou usuarios autorizados;
- categorias default precisam de regra clara.

Risco:

- categorias sao usadas por gastos;
- categorias legadas precisam continuar acessiveis ate encerramento do fallback.

### 5.4 `expenses`

Uso atual:

- gastos ja validam `family_member_id` e `category_id` por organization ativa ou legado;
- inserts gravam `organization_id`.

Direcao futura:

- select/insert/update/delete baseado em membership da organization do gasto;
- opcionalmente combinar com permissoes de modulo no nivel da aplicacao, nao necessariamente em RLS inicial;
- validacao de FK cruzada por organization continua na aplicacao nesta fase.

Risco:

- gasto e a tabela mais sensivel por volume e impacto no dashboard/relatorios.

### 5.5 `payable_bills`

Uso atual:

- contas a pagar validam `responsible_member_id` por organization ativa ou legado;
- inserts gravam `organization_id`.

Direcao futura:

- policies por membership da organization;
- manter fallback legado temporario se ainda houver dados sem organization.

Risco:

- status/update/delete precisam continuar respeitando organization ativa.

### 5.6 `receivable_incomes`

Uso atual:

- contas a receber validam `receiver_member_id` por organization ativa ou legado;
- inserts gravam `organization_id`.

Direcao futura:

- policies por membership da organization;
- preservar compatibilidade legada temporaria.

Risco:

- dashboard e relatorios dependem da tabela.

### 5.7 `banks`

Uso atual:

- bancos validam `family_member_id` por organization ativa ou legado;
- inserts gravam `organization_id`;
- listagem nao depende de `is_active = true` para membros historicos.

Direcao futura:

- policies por membership da organization;
- cuidado para nao ocultar contas historicas por membro inativo;
- manter testes de listagem historica.

Risco:

- bancos sao historicos e nao devem sumir ao desativar membro.

### 5.8 `user_module_permissions` e `user_feature_permissions`

Uso atual:

- receberam `organization_id` nullable;
- ainda precisam de hardening multi-org pleno.

Direcao futura:

- policies por organization;
- admin/owner da organization pode gerenciar permissoes;
- usuario pode ler permissoes proprias quando necessario.

Risco:

- permissoes afetam visibilidade do app inteiro;
- service role/admin pode mascarar problemas se testes nao simularem usuario autenticado comum.

## 6. Helpers SQL propostos

Helpers existentes podem ser suficientes para a primeira fase:

```txt
public.is_organization_member(uuid)
public.is_organization_admin(uuid)
public.current_user_organization_ids()
```

Antes de criar novos helpers, validar se esses atendem todas as policies financeiras.

Se novos helpers forem necessarios, eles devem seguir o padrao:

```sql
language sql
stable
security definer
set search_path = public
```

Regras obrigatorias:

- evitar consulta recursiva direta em policies de `organization_memberships`;
- revogar `public` quando apropriado;
- conceder execute apenas para roles necessarias;
- nao usar helper volatil se a checagem puder ser `stable`;
- documentar cada helper antes de migration.

Possiveis helpers futuros, apenas se necessario:

```txt
public.can_read_organization_finance(target_organization_id uuid)
public.can_admin_organization_finance(target_organization_id uuid)
```

Esses helpers nao devem ser criados antes de justificativa clara.

## 7. Tratamento de legado `organization_id IS NULL`

### 7.1 Estrategia recomendada inicial

Na primeira fase de RLS financeira, considerar policies temporarias que permitam:

```txt
organization_id in current_user_organization_ids()
OR organization_id IS NULL com fallback owner_id seguro
```

O fallback legado deve ser temporario e documentado.

### 7.2 Condicoes antes de remover fallback

Remover suporte a `organization_id IS NULL` apenas depois de:

- backfill validado em todos os ambientes;
- queries confirmando zero registros legados em tabelas financeiras;
- actions testadas para sempre gravar `organization_id`;
- testes cross-tenant passando;
- plano de rollback definido;
- decisao explicita registrada em issue/PR.

### 7.3 Risco principal

O maior risco do legado e permitir que `organization_id IS NULL` vire um caminho amplo demais de acesso. Por isso, qualquer fallback precisa continuar amarrado a `owner_id` ou a uma regra equivalente segura.

## 8. Ordem sugerida de rollout

Nao aplicar RLS financeira em uma unica PR.

Ordem sugerida:

1. Inventariar RLS atual e confirmar policies por tabela.
2. Confirmar/ajustar testes que exercitam usuario autenticado comum, nao service role.
3. Planejar migration de helpers, se necessaria.
4. Aplicar RLS em tabela de menor impacto primeiro, com rollback.
5. Aplicar por grupos pequenos:
   - categorias e pessoas;
   - gastos;
   - contas a pagar;
   - contas a receber;
   - bancos;
   - permissoes/admin.
6. Validar dashboard e relatorios apos cada grupo.
7. Somente depois planejar `organization_id NOT NULL`.

## 9. Rollback

Cada migration futura de RLS deve ter plano de rollback documentado no corpo da PR.

Rollback minimo esperado:

- nomes das policies antigas e novas;
- comandos para dropar policies novas;
- comandos para restaurar policies anteriores, se aplicavel;
- criterio para pausar rollout;
- queries de validacao antes/depois.

Nao aprovar migration de RLS sem rollback claro.

## 10. Matriz de testes necessaria

Antes de aplicar RLS, planejar ou implementar testes para:

| Cenario | Esperado |
| --- | --- |
| Usuario da organization A le dados da A | permitido |
| Usuario da organization A le dados da B | negado |
| Usuario da organization B escreve dados da A | negado |
| Usuario membro de duas organizations | acesso conforme organization ativa/permitida |
| Registro legado `organization_id IS NULL` | permitido apenas pelo fallback definido |
| Registro com member/category de outra organization | negado pela aplicacao e/ou RLS futura |
| Service role | nao deve ser usado como unica prova de seguranca |
| Dashboard/relatorios apos RLS | continuam filtrados por organization |

Testes ja existentes de actions e guards continuam uteis, mas nao substituem testes reais de RLS.

## 11. PRs futuras recomendadas

Abrir PRs pequenas nesta ordem:

1. Inventario detalhado de policies atuais.
2. Plano final de helpers RLS, se necessario.
3. Testes RLS de leitura por organization.
4. Primeira migration RLS em tabela de menor risco.
5. Expansao gradual por tabela/grupo.
6. Validacao final antes de qualquer `NOT NULL`.

## 12. Fora de escopo deste plano

Este plano nao implementa:

- migration nova;
- policy nova;
- alteracao em RLS atual;
- rota `[orgSlug]`;
- billing;
- `organization_id NOT NULL`;
- remocao de `owner_id`;
- mudanca visual.

## 13. Conclusao

O proximo passo seguro nao e aplicar RLS imediatamente.

O proximo passo seguro e concluir o inventario detalhado das policies atuais e validar a estrategia de helpers/legado/testes antes da primeira migration de RLS financeira.
