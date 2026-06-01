# Riscos, Qualidade e Mudancas - FamilyFinance

> Status DocDoc: Historico/PM
> Uso seguro: contexto de riscos, qualidade e processo de mudancas.
> Observacao: nao e evidencia atual de CI, seguranca, deploy ou runtime; cruzar
> com `docs/VALIDACAO_TECNICA.md` e workflows atuais.

Este documento registra os riscos, controles de qualidade e regras de mudanca do FamilyFinance conforme o estado atual do codigo e da estrategia aprovada.

## Estado atual de referencia

O projeto esta em MVP Web/PWA funcional em consolidacao, com uma nova fase estrategica documentada para evolucao SaaS multi-tenant.

Ja existem:

- autenticacao Supabase;
- proxy global de sessao;
- Dashboard;
- Pessoas;
- Gastos;
- Contas a pagar;
- Contas a receber;
- Bancos;
- Relatorios;
- Configuracoes;
- Admin familiar;
- usuarios familiares;
- permissoes por modulo, acao e escopo;
- migrations Supabase;
- testes unitarios;
- testes de integracao;
- documentacao PMBOK;
- estrategia SaaS multi-tenant;
- solicitacao formal de mudanca para SaaS multi-tenant.

## Mudanca estrategica registrada

O projeto nasceu como solucao financeira familiar privada e single-tenant. A nova direcao registrada em `docs/SAAS_MULTI_TENANT_STRATEGY.md` e `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md` e evoluir para um SaaS multi-tenant.

Essa mudanca altera o perfil de risco do projeto.

Antes, o principal risco era manter um MVP familiar coerente. Agora, alem disso, o projeto precisa controlar riscos de:

- isolamento entre organizacoes;
- RLS multi-tenant;
- migration incremental;
- coexistencia temporaria de `owner_id` e `organization_id`;
- rotas por `orgSlug`;
- billing futuro;
- diferenca entre Platform admin e Organization admin;
- testes cross-tenant.

## Riscos principais

| ID | Risco | Probabilidade | Impacto | Resposta |
|---|---|---:|---:|---|
| R-001 | O projeto crescer para produto comercial antes da validacao tecnica multi-tenant | Media | Alto | Implementar SaaS por fases e bloquear billing ate isolamento validado |
| R-002 | Duplicacao de dados iniciais | Baixa | Alto | Migration 002, constraints e upsert |
| R-003 | Confusao entre usuario do app e membro financeiro | Media | Alto | Manter separacao entre `profiles`, `auth.users` e `family_members` |
| R-004 | Permissoes aplicadas apenas na tela | Baixa | Alto | Server Actions e queries usam helpers de permissao |
| R-005 | Iniciar app mobile antes da consolidacao Web/PWA SaaS | Media | Alto | Consolidar Web/PWA e multi-tenant antes de Expo/React Native |
| R-006 | Custo de app nativo ser subestimado | Media | Alto | Trabalhar por fases e com aceite |
| R-007 | Interface ficar complexa para uso familiar | Media | Medio | Priorizar mobile-first e simplicidade |
| R-008 | Build quebrar apos mudancas de Next/Supabase | Media | Alto | Rodar lint, build e testes por release |
| R-009 | `SUPABASE_SERVICE_ROLE_KEY` ser importada em Client Component | Baixa | Critico | Revisar imports e manter admin client server-side |
| R-010 | RLS ficar menos granular que as permissoes da aplicacao | Media | Alto | Manter filtros server-side e evoluir RLS quando necessario |
| R-011 | Codigo mockado se misturar com producao | Media | Medio | Separar fixtures de funcoes puras em `calculations.ts` |
| R-012 | Documentacao ficar atrasada em relacao ao codigo | Alta | Medio | Atualizar docs junto com cada mudanca relevante |
| R-013 | Usuario familiar conseguir mutar dado fora do escopo | Baixa | Alto | Toda mutacao deve usar `assertCanAccessMember` ou helper equivalente |
| R-014 | Acoes silenciosas esconderem erro real | Media | Medio | Melhorar retorno de erro e feedback visual |
| R-015 | Periodo fixo gerar dados confusos | Media | Medio | Implementar filtros/periodo dinamico |

## Riscos especificos SaaS multi-tenant

| ID | Risco | Probabilidade | Impacto | Resposta |
|---|---|---:|---:|---|
| SM-001 | Vazamento de dados entre organizacoes | Media | Critico | RLS por membership, testes cross-tenant e revisao manual |
| SM-002 | Migration multi-tenant quebrar dados existentes | Media | Alto | Migrations incrementais, backfill controlado, backup e rollback |
| SM-003 | Confusao entre `owner_id` e `organization_id` | Alta | Alto | Padronizar nomenclatura e documentar transicao |
| SM-004 | Remover `owner_id` cedo demais | Media | Alto | Manter compatibilidade ate queries, actions e RLS estarem validadas |
| SM-005 | Implementar billing antes do isolamento seguro | Media | Alto | Billing somente apos fase SaaS base aceita |
| SM-006 | Introduzir `[orgSlug]` antes de resolver organizacao server-side | Media | Alto | Criar helpers e validações antes das rotas |
| SM-007 | Usuario acessar slug de organizacao sem membership | Media | Critico | `requireOrganizationAccess()` e RLS por membership |
| SM-008 | Platform admin acessar dados financeiros sem governanca | Media | Alto | Separar Platform admin de Organization admin e exigir auditoria |
| SM-009 | Um usuario em multiplas organizacoes receber permissoes erradas | Media | Alto | Perfil e permissoes sempre por `organization_id` |
| SM-010 | Slug duplicado, invalido ou inseguro | Baixa | Medio | Unique index, normalizacao e validacao server-side |
| SM-011 | PRs grandes misturarem banco, RLS, UI, billing e rotas | Alta | Alto | Quebrar por fases documentadas e PRs pequenas |
| SM-012 | Testes nao cobrirem isolamento entre tenants | Media | Alto | Criar testes de duas organizacoes com usuarios distintos |
| SM-013 | Dados antigos ficarem sem organizacao no backfill | Media | Alto | Validar contagens antes/depois e bloquear `organization_id` nulo na fase final |
| SM-014 | Onboarding SaaS deixar usuario sem organizacao ativa | Media | Medio | Criar fallback, organizacao inicial e fluxo de selecao |
| SM-015 | Migrations serem aplicadas sem plano SQL revisado | Media | Alto | Criar PR documental de plano SQL antes de migration real |

## Problemas ja identificados e tratados

| ID | Problema | Status | Acao |
|---|---|---|---|
| I-001 | Seed duplicou membros financeiros | Corrigido | Migration 002 e upsert |
| I-002 | Lint varria pasta `.next` | Corrigido | Ignorar build output no ESLint |
| I-003 | `cacheComponents` conflitou com rotas autenticadas | Corrigido | Removido do `next.config` |
| I-004 | Supabase inferiu relacionamentos como array | Corrigido | Normalizacao dos relacionamentos |
| I-005 | README listava como pendente recursos ja implementados | Corrigido | README atualizado |
| I-006 | Nao havia documento tecnico de arquitetura | Corrigido | `docs/ARCHITECTURE.md` criado |
| I-007 | Documentos PM indicavam Admin/permissoes como planejados | Corrigido | PM docs atualizados |
| I-008 | Documentos estrategicos antigos diziam que SaaS estava fora do escopo | Em correcao | Alinhamento com a solicitacao SaaS multi-tenant |

## Debitos tecnicos conhecidos

| ID | Debito | Prioridade | Plano |
|---|---|---:|---|
| DT-001 | `lib/finance/calculations.ts` mistura funcoes puras e fixtures | Alta | Separar calculos puros de dados mockados |
| DT-002 | Edicao completa de gastos ainda falta | Alta | Criar action/form de edicao |
| DT-003 | Edicao completa de contas a pagar ainda falta | Alta | Criar action/form de edicao |
| DT-004 | Edicao completa de contas a receber ainda falta | Alta | Criar action/form de edicao |
| DT-005 | Edicao completa de bancos ainda falta | Alta | Criar action/form de edicao |
| DT-006 | Edicao de categorias ainda falta | Media | Criar action/form de edicao |
| DT-007 | UI completa de `user_feature_permissions` ainda falta | Media | Evoluir Admin > Permissoes |
| DT-008 | Periodo dinamico ainda falta | Alta | Criar filtro por mes/periodo |
| DT-009 | Relatorios sem exportacao/graficos | Media | Criar fase especifica |
| DT-010 | Testes de Server Actions reais ainda faltam | Media | Adicionar mocks de Supabase por action |
| DT-011 | Testes E2E ainda faltam | Baixa | Planejar com Playwright/Cypress se necessario |
| DT-012 | Modelo atual ainda usa `owner_id` como eixo principal | Alta | Planejar transicao para `organization_id` |
| DT-013 | Ainda nao existe tabela `organizations` | Alta | Criar migration base apos plano SQL |
| DT-014 | Ainda nao existe `organization_memberships` | Alta | Criar migration base apos plano SQL |
| DT-015 | Ainda nao ha testes cross-tenant | Alta | Criar fixtures/testes multi-tenant |

## Plano de qualidade

A qualidade sera validada por:

- lint sem erros;
- build sem erros;
- testes automatizados aprovados;
- teste manual por modulo;
- validacao de migrations no Supabase;
- revisao de permissoes por perfil;
- revisao de escopo `own`, `selected`, `family`;
- revisao de dados no Dashboard;
- revisao de Relatorios;
- aceite do Admin familiar/organizacao;
- documentacao atualizada;
- testes de isolamento multi-tenant quando a fase SaaS chegar ao banco/RLS.

## Checklist de qualidade por release

### Codigo

- [ ] `npm run lint` aprovado.
- [ ] `npm run build` aprovado.
- [ ] `npm run test:run` aprovado.
- [ ] Sem secrets expostos no client.
- [ ] Sem import de `createAdminClient` em Client Component.
- [ ] Sem uso indevido de fixtures em telas reais.
- [ ] Sem query financeira sem filtro de organizacao quando `organization_id` estiver ativo.
- [ ] Sem Server Action mutando dados fora da organizacao ativa.

### Banco

- [ ] Migrations executadas sem erro.
- [ ] Tabelas principais existem.
- [ ] Tabelas de permissoes existem.
- [ ] RLS ativo.
- [ ] Seed sem duplicacao.
- [ ] Constraints aplicadas.
- [ ] Plano de rollback revisado quando houver migration.
- [ ] Backfill validado por contagem quando houver `organization_id`.
- [ ] Nenhum registro financeiro fica sem organizacao na fase final.

### Autenticacao

- [ ] Login funciona.
- [ ] Cadastro valida regra vigente.
- [ ] Confirmacao de e-mail funciona.
- [ ] Profile e vinculado ao Auth user.
- [ ] Usuario sem sessao redireciona para login.
- [ ] Usuario inativo e bloqueado.
- [ ] Usuario com multiplas organizacoes resolve organizacao ativa corretamente quando essa fase existir.

### Permissoes

- [ ] Admin ve todos os modulos da propria organizacao.
- [ ] Usuario comum ve apenas modulos liberados.
- [ ] Menu desktop respeita permissao.
- [ ] Menu mobile respeita permissao.
- [ ] Escopo `own` funciona.
- [ ] Escopo `selected` funciona.
- [ ] Escopo `family` funciona dentro da organizacao.
- [ ] `can_create` e respeitado.
- [ ] `can_edit` e respeitado.
- [ ] `can_delete` e respeitado.
- [ ] Usuario de uma organizacao nao acessa outra organizacao.

### Modulos financeiros

- [ ] Dashboard reflete dados reais.
- [ ] Gastos reduzem limite mensal.
- [ ] Contas vencidas aparecem como atrasadas.
- [ ] Recebimentos vencidos aparecem como atrasados.
- [ ] Bancos atualizam saldo.
- [ ] Relatorios batem com os modulos.
- [ ] Configuracoes atualizam categorias/limites.
- [ ] Todos os modulos respeitam organizacao ativa quando `organization_id` for implementado.

### Documentacao

- [ ] README atualizado quando houver mudanca de fase visivel.
- [ ] `docs/ARCHITECTURE.md` atualizado se houver mudanca estrutural.
- [ ] Requisitos atualizados se houver mudanca funcional.
- [ ] Roadmap atualizado se houver mudanca de fase.
- [ ] Riscos atualizados se novo risco aparecer.
- [ ] PM docs atualizados em mudancas grandes.

## Controle de mudancas

Mudancas relevantes devem registrar:

- titulo;
- solicitante;
- motivo;
- impacto tecnico;
- impacto em banco/migrations;
- impacto em permissao;
- impacto em seguranca;
- impacto em UI/UX;
- impacto em mobile;
- impacto em prazo;
- impacto em custo;
- decisao aprovada ou rejeitada.

## Classificacao de mudancas

### Mudanca pequena

Exemplos:

- texto;
- ajuste visual;
- melhoria de feedback;
- cor/espacamento;
- ajuste de copy.

Requer:

- teste manual;
- documentacao apenas se afetar regra.

### Mudanca media

Exemplos:

- novo campo em formulario;
- nova validacao;
- novo filtro;
- nova action;
- alteracao em permissao;
- novo componente compartilhado.

Requer:

- lint;
- build;
- teste manual;
- possivel teste automatizado;
- atualizacao de docs.

### Mudanca grande

Exemplos:

- nova migration;
- novo modulo;
- mudanca em auth;
- mudanca em RLS;
- mudanca no modelo de permissoes;
- app mobile;
- integrações externas;
- multi-tenancy;
- billing;
- rotas por organizacao.

Requer:

- planejamento;
- validacao de risco;
- migration revisada;
- plano de rollback;
- lint;
- build;
- testes;
- testes de isolamento quando envolver tenant;
- atualizacao de README/docs;
- aceite.

## Regra de mudanca de escopo

A evolucao para SaaS multi-tenant foi registrada como nova fase em:

- `docs/SAAS_MULTI_TENANT_STRATEGY.md`;
- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`.

Qualquer item que mova o projeto para alem dessa fase, como:

- produto financeiro regulado;
- Open Finance;
- marketplace;
- multi-empresa contabil;
- integracao bancaria automatica;
- IA financeira com tomada de decisao;
- app nativo completo;
- billing em producao;

precisa ser tratado como nova decisao ou subfase formal.

## Definition of Done

Uma mudanca so sera considerada pronta quando:

- codigo implementado, quando aplicavel;
- permissao validada no servidor quando aplicavel;
- dados persistidos corretamente;
- lint aprovado;
- build aprovado;
- testes aprovados ou justificativa registrada;
- teste manual realizado;
- documentacao atualizada;
- criterio de aceite validado.

## Definition of Done - SaaS base

A fase SaaS base so sera considerada pronta quando:

- `organizations` existir;
- `organization_memberships` existir;
- dados antigos estiverem associados a uma organizacao inicial;
- tabelas financeiras tiverem `organization_id` preenchido;
- queries server-side filtrarem por organizacao;
- actions validarem organizacao e permissao;
- RLS isolar dados por membership;
- usuario de uma organizacao nao conseguir ler dados de outra;
- admin de uma organizacao nao conseguir administrar outra;
- dashboard respeitar organizacao ativa;
- testes automatizados cobrirem isolamento minimo;
- documentacao estiver atualizada;
- CI estiver verde.
