# Riscos, Qualidade e Mudancas - FamilyFinance

Este documento registra os riscos, controles de qualidade e regras de mudanca do FamilyFinance conforme o estado atual do codigo.

## Estado atual de referencia

O projeto esta em MVP Web/PWA funcional em consolidacao.

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
- testes de integracao.

## Riscos principais

| ID | Risco | Probabilidade | Impacto | Resposta |
|---|---|---:|---:|---|
| R-001 | O projeto crescer para produto comercial antes da validacao familiar | Media | Alto | Manter escopo personalizado aprovado |
| R-002 | Duplicacao de dados iniciais | Baixa | Alto | Migration 002, constraints e upsert |
| R-003 | Confusao entre usuario do app e membro financeiro | Media | Alto | Manter separacao entre `profiles` e `family_members` |
| R-004 | Permissoes aplicadas apenas na tela | Baixa | Alto | Server Actions e queries usam helpers de permissao |
| R-005 | Iniciar app mobile antes da consolidacao Web/PWA | Media | Alto | Consolidar MVP web antes de Expo/React Native |
| R-006 | Custo de app nativo ser subestimado | Media | Alto | Trabalhar por fases e com aceite |
| R-007 | Interface ficar complexa para uso familiar | Media | Medio | Priorizar mobile-first e simplicidade |
| R-008 | Build quebrar apos mudancas de Next/Supabase | Media | Alto | Rodar lint, build e testes por release |
| R-009 | `SUPABASE_SERVICE_ROLE_KEY` ser importada em Client Component | Baixa | Critico | Revisar imports e manter admin client server-side |
| R-010 | RLS ficar menos granular que as permissoes da aplicacao | Media | Alto | Manter filtros server-side e evoluir RLS quando necessario |
| R-011 | Codigo mockado se misturar com producao | Media | Medio | Separar fixtures de funcoes puras em `calculations.ts` |
| R-012 | Documentacao ficar atrasada em relacao ao codigo | Alta | Medio | Atualizar docs junto com cada mudanca relevante |
| R-013 | Usuario familiar conseguir mutar dado fora do escopo | Baixa | Alto | Toda mutacao deve usar `assertCanAccessMember` ou `requireAdminProfile` |
| R-014 | Acoes silenciosas esconderem erro real | Media | Medio | Melhorar retorno de erro e feedback visual |
| R-015 | Periodo fixo gerar dados confusos | Media | Medio | Implementar filtros/periodo dinamico |

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

## Plano de qualidade

A qualidade sera validada por:

- lint sem erros;
- build sem erros;
- testes automatizados aprovados;
- teste manual por modulo;
- validacao de migrations no Supabase;
- revisao de permissao por perfil;
- revisao de escopo `own`, `selected`, `family`;
- revisao de dados no Dashboard;
- revisao de Relatorios;
- aceite do Admin familiar;
- documentacao atualizada.

## Checklist de qualidade por release

### Codigo

- [ ] `npm run lint` aprovado.
- [ ] `npm run build` aprovado.
- [ ] `npm run test:run` aprovado.
- [ ] Sem secrets expostos no client.
- [ ] Sem import de `createAdminClient` em Client Component.
- [ ] Sem uso indevido de fixtures em telas reais.

### Banco

- [ ] Migrations executadas sem erro.
- [ ] Tabelas principais existem.
- [ ] Tabelas de permissoes existem.
- [ ] RLS ativo.
- [ ] Seed sem duplicacao.
- [ ] Constraints aplicadas.

### Autenticacao

- [ ] Login funciona.
- [ ] Cadastro valida e-mail autorizado.
- [ ] Confirmacao de e-mail funciona.
- [ ] Profile e vinculado ao Auth user.
- [ ] Usuario sem sessao redireciona para login.
- [ ] Usuario inativo e bloqueado.

### Permissoes

- [ ] Admin ve todos os modulos.
- [ ] Usuario comum ve apenas modulos liberados.
- [ ] Menu desktop respeita permissao.
- [ ] Menu mobile respeita permissao.
- [ ] Escopo `own` funciona.
- [ ] Escopo `selected` funciona.
- [ ] Escopo `family` funciona.
- [ ] `can_create` e respeitado.
- [ ] `can_edit` e respeitado.
- [ ] `can_delete` e respeitado.

### Modulos financeiros

- [ ] Dashboard reflete dados reais.
- [ ] Gastos reduzem limite mensal.
- [ ] Contas vencidas aparecem como atrasadas.
- [ ] Recebimentos vencidos aparecem como atrasados.
- [ ] Bancos atualizam saldo.
- [ ] Relatorios batem com os modulos.
- [ ] Configuracoes atualizam categorias/limites.

### Documentacao

- [ ] README atualizado.
- [ ] `docs/ARCHITECTURE.md` atualizado se houver mudanca estrutural.
- [ ] Requisitos atualizados se houver mudanca funcional.
- [ ] Roadmap atualizado se houver mudanca de fase.
- [ ] Riscos atualizados se novo risco aparecer.

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
- alteracao em permissao.

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
- integrações externas.

Requer:

- planejamento;
- validacao de risco;
- migration revisada;
- lint;
- build;
- testes;
- atualizacao de README/docs;
- aceite.

## Regra de mudanca de escopo

Qualquer item que mova o projeto para:

- SaaS;
- multiplas familias;
- assinatura;
- venda publica;
- marketplace;
- integracao bancaria automatica;
- Open Finance;
- produto financeiro regulado;
- app nativo completo;

precisa ser tratado como nova fase e novo escopo.

## Definition of Done

Uma mudanca so sera considerada pronta quando:

- codigo implementado;
- permissao validada no servidor quando aplicavel;
- dados persistidos corretamente;
- lint aprovado;
- build aprovado;
- testes aprovados ou justificativa registrada;
- teste manual realizado;
- documentacao atualizada;
- criterio de aceite validado.
