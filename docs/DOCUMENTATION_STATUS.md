# Operacao DocDoc - Status da Documentacao

> Status DocDoc: Atual
> Uso atual: mapa vivo para reconciliar documentacao atrasada sem apagar
> historico util.
> Atualizado em: 2026-06-01.

## Objetivo

Este documento classifica quais arquivos sao fonte de verdade, quais sao
historicos e quais foram parcialmente superados por merges recentes.

Ele nao substitui os documentos de conteudo. Ele diz qual documento deve guiar
trabalho novo.

## Hierarquia de verdade

1. Codigo, migrations e workflows versionados na `main`.
2. `docs/VALIDACAO_TECNICA.md`.
3. `docs/SAAS_GAP_REGISTER.md`.
4. `docs/audits/CODEBASE_SCAN_GAP_CHECKLIST_2026-06-01.md`.
5. ADRs em `docs/adr/`, quando a decisao ainda se aplica.
6. Runbooks, planos, auditorias antigas e PM docs como contexto historico.

## Status centrais

| Documento | Status DocDoc | Uso seguro | Superado por / observacao |
| --- | --- | --- | --- |
| `docs/README.md` | Atual | Entrada da documentacao. | Criado pela Operacao DocDoc. |
| `docs/VALIDACAO_TECNICA.md` | Atual | Contrato operacional atual. | Deve refletir stack, CI, deploy, envs, migrations e gates atuais. |
| `docs/SAAS_GAP_REGISTER.md` | Atual | Registro vivo de gaps. | Atualizar apos cada PR que fecha ou reduz gap. |
| `docs/audits/CODEBASE_SCAN_GAP_CHECKLIST_2026-06-01.md` | Atual | Checklist de execucao tecnica. | Usar para ticagem de gaps/dividas. |
| `docs/SAAS_OPERATIONAL_ROADMAP.md` | Parcialmente superado | Contexto consolidado de transicao SaaS. | Cruzar com `VALIDACAO_TECNICA.md` e `SAAS_GAP_REGISTER.md` antes de usar. |
| `docs/SAAS_IMPLEMENTATION_STATUS.md` | Parcialmente superado | Historico da transicao multi-tenant inicial. | Nao usar como estado atual de migrations; usar `VALIDACAO_TECNICA.md`. |
| `docs/SAAS_RLS_LIVE_STATUS.md` | Parcialmente superado | Contexto RLS/live gate. | Cruzar com migrations atuais e `VALIDACAO_TECNICA.md`. |
| `docs/SAAS_DATABASE_MIGRATION_PLAN.md` | Historico | Plano de migracao SaaS. | Estado atual esta em migrations `001` a `043` e `VALIDACAO_TECNICA.md`. |
| `docs/SAAS_MULTI_TENANT_STRATEGY.md` | Historico/estrategia | Contexto estrategico multi-tenant. | Nao usar como evidencias de implementacao atual. |
| `docs/FINANCIAL_RLS_MULTI_TENANT_PLAN.md` | Historico | Plano de RLS financeiro. | Conferir estado real em migrations, RLS docs e live gates. |
| `docs/MOBILE_STRATEGY.md` | Atual como estrategia | Decisao de canais web admin + app nativo futuro. | Nao significa que app nativo ja exista. |
| `docs/MOBILE_FIRST_UX.md` | Atual como diretriz UX | Diretriz visual/UX mobile-first. | Nao substitui contratos de design system. |

## Root Docs DocDoc

Arquivos Markdown diretamente em `docs/` misturam contrato atual, historico de
PR, plano antigo, estrategia e proposta. Use esta tabela antes de abrir um
arquivo raiz isolado.

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/ACCESS_CHANNELS.md` | Parcialmente superado/estrategia | Contexto de canais web admin + app mobile. | Confirmar decisao atual em `docs/MOBILE_STRATEGY.md`. |
| `docs/ADMIN_PERMISSIONS.md` | Atual como regra de produto | Contexto de admin familiar, roles e permissoes. | Confirmar estado tecnico em `docs/VALIDACAO_TECNICA.md` e codigo. |
| `docs/ARCHITECTURE.md` | Atual como visao tecnica | Arquitetura geral Next/Supabase/RLS. | Conferir versoes e migrations em `docs/VALIDACAO_TECNICA.md`. |
| `docs/AUTH_FLOW_AUDIT.md` | Parcialmente superado/historico | Auditoria do fluxo de auth em uma etapa anterior. | Estado vivo fica no codigo, CI e `docs/VALIDACAO_TECNICA.md`. |
| `docs/branch-protection.md` | Atual como recomendacao operacional | Guia de protecao da branch `main`. | Confirmar regras reais no GitHub antes de assumir cobertura. |
| `docs/COMPONENT_ARCHITECTURE.md` | Atual como convencao de organizacao | Padrao de paginas, componentes, `lib/finance` e UI primitives. | Confirmar com codigo atual antes de refatorar. |
| `docs/COPILOT_REVIEW_RESOLUTION.md` | Historico | Registro de comentarios ja tratados. | Nao usar como backlog atual. |
| `docs/COST_ESTIMATE.md` | Parcialmente superado/historico | Contexto de custo inicial. | Nao reflete automaticamente SaaS, billing ou producao atual. |
| `docs/DASHBOARD_DEBT_SUMMARY.md` | Parcialmente superado/historico | Contexto do refinamento de dashboard/contas. | Conferir dashboard atual e contratos em `docs/audits/`. |
| `docs/DOCUMENTATION_STATUS.md` | Atual | Mapa vivo DocDoc. | Fonte para decidir uso seguro de docs. |
| `docs/ERROR_BOUNDARY_RETRY.md` | Historico/decisao pontual | Contexto da troca para `unstable_retry`. | Confirmar API vigente no Next antes de alterar. |
| `docs/EXPENSE_EDIT_FEEDBACK.md` | Historico/implementacao pontual | Contexto de edicao/exclusao de gastos. | Conferir codigo atual antes de reabrir escopo. |
| `docs/EXPENSE_LIST_OPTIMIZATION.md` | Historico/implementacao pontual | Contexto da otimizacao da lista de gastos. | Nao usar como estado completo da tela atual. |
| `docs/FINANCIAL_RLS_MULTI_TENANT_PLAN.md` | Parcialmente superado/historico | Plano inicial de RLS financeiro multi-tenant. | Estado atual fica em migrations `030` a `043`, RLS docs e live gates. |
| `docs/FREE_APP_DISTRIBUTION.md` | Proposta/historico | Opcoes de distribuicao app/PWA. | Nao e contrato atual de deploy. |
| `docs/INITIAL_ORGANIZATION_BACKFILL_PLAN.md` | Parcialmente superado/historico | Contexto de bootstrap/backfill inicial. | Confirmar migrations atuais e runbooks antes de operar. |
| `docs/LIVE_FLOW_TESTS.md` | Historico/evidencia pontual | Cobertura adicionada em uma fase anterior. | CI atual e `docs/VALIDACAO_TECNICA.md` prevalecem. |
| `docs/LIVE_MVP_AUDIT.md` | Parcialmente superado/historico | Auditoria do MVP vivo anterior ao SaaS-first. | Produto atual e SaaS-first prevalecem. |
| `docs/MOBILE_FIRST_UX.md` | Atual como diretriz UX | Diretriz mobile-first. | Nao substitui contratos de design system. |
| `docs/MOBILE_STRATEGY.md` | Atual como estrategia de canal | Estrategia web admin + mobile futuro. | Nao prova app nativo implementado. |
| `docs/PAYABLE_BILL_ACTION_FEEDBACK.md` | Historico/implementacao pontual | Contexto de feedback/exclusao em contas. | Conferir actions atuais antes de alterar. |
| `docs/PAYABLE_BILL_EDIT_FLOW.md` | Historico/implementacao pontual | Contexto de edicao de contas/dividas. | Conferir modulo atual antes de reabrir. |
| `docs/PAYABLE_BILLS_AS_DEBTS.md` | Atual como decisao MVP | Contexto de contas a pagar como dividas. | Confirmar codigo atual e linguagem de produto. |
| `docs/PERMISSION_AND_DASHBOARD_STRATEGY.md` | Parcialmente superado/estrategia | Contexto de permissoes e dashboard. | Confirmar runtime atual em access-control, RLS e docs atuais. |
| `docs/PRODUCT_VISION.md` | Atual como visao de produto | Direcao SaaS-first e abandono do single-tenant como norte. | Nao substitui ADRs, gaps e validacao tecnica. |
| `docs/README.md` | Atual | Entrada da documentacao. | Ler antes de documentos antigos. |
| `docs/SAAS_DATABASE_MIGRATION_PLAN.md` | Historico | Plano antigo de migration SaaS. | Estado real esta em migrations `001` a `043`. |
| `docs/SAAS_GAP_REGISTER.md` | Atual | Registro vivo de gaps. | Atualizar apos cada PR que muda risco/estado. |
| `docs/SAAS_IMPLEMENTATION_STATUS.md` | Parcialmente superado | Historico da transicao SaaS inicial. | `docs/VALIDACAO_TECNICA.md` prevalece para estado atual. |
| `docs/SAAS_MULTI_TENANT_STRATEGY.md` | Historico/estrategia | Contexto estrategico da transicao multi-tenant. | Nao usar como evidencia operacional. |
| `docs/SAAS_OPERATIONAL_ROADMAP.md` | Parcialmente superado | Contexto consolidado de transicao SaaS. | Cruzar com gap register e validacao tecnica. |
| `docs/SAAS_RLS_LIVE_STATUS.md` | Parcialmente superado | Contexto RLS/live gate. | Confirmar migrations/policies atuais antes de operar. |
| `docs/TESTING_STRATEGY.md` | Parcialmente superado/estrategia | Contexto de estrategia de testes. | CI atual e guards vivos prevalecem. |
| `docs/UI_STATES.md` | Atual como convencao UX | Padrao de loading/vazio/erro/sucesso. | Conferir componentes atuais antes de refatorar. |
| `docs/VALIDACAO_TECNICA.md` | Atual | Contrato operacional vigente. | Fonte principal para stack, CI, deploy, Supabase e gates. |

## Diretorios

| Diretorio | Status DocDoc | Uso seguro |
| --- | --- | --- |
| `docs/adr/` | Historico decisorio com indice atual | Usar `docs/adr/README.md` e `docs/adr/DOCDOC_STATUS.md` como entrada. Manter ADRs; criar nova ADR para decisao nova ou mudanca estrutural. |
| `docs/audits/` | Misto com indice atual | Usar `docs/audits/README.md` antes de seguir auditorias antigas. Contratos atuais e readiness historicos ficam separados ali. |
| `docs/design/` | Atual com indice | Usar `docs/design/README.md` como entrada. Design docs orientam direcao visual, mas nao provam implementacao atual. |
| `docs/e2e/` | Atual com indice | Usar `docs/e2e/README.md` como entrada para contratos E2E. Roadmaps nao substituem specs, CI ou evidencia gated. |
| `docs/pm/` | Historico/PM com indice atual | Usar `docs/pm/README.md` como entrada. Contexto de gestao, nao contrato tecnico atual. |
| `docs/rls/` | Misto com indice atual | Usar `docs/rls/README.md` como entrada. Live Gate segue operacional; planos antigos precisam ser cruzados com migrations e testes atuais. |
| `docs/roadmaps/` | Misto com indice atual | Usar `docs/roadmaps/README.md` como entrada. Roadmaps orientam sequencia, mas nao provam implementacao. |
| `docs/runbooks/` | Misto com indice atual | Usar `docs/runbooks/README.md` antes de executar runbooks antigos. Stripe evidence segue atual; hardening/fallback runbooks sao majoritariamente historicos. |
| `docs/sql/` | Atual com indice | Usar `docs/sql/README.md` como entrada. Queries sao ferramentas operacionais, nao autorizacao automatica para executar SQL. |

## Fila DocDoc inicial

- [x] Criar entrada `docs/README.md`.
- [x] Criar mapa `docs/DOCUMENTATION_STATUS.md`.
- [x] Salvar skill `.agents/skills/operacao-docdoc/SKILL.md`.
- [x] Marcar documentos centrais com notas DocDoc.
- [x] Criar indice DocDoc inicial para `docs/audits/*`.
- [ ] Revisar `docs/audits/*` restantes em lotes pequenos.
- [x] Criar indice DocDoc inicial para `docs/runbooks/*`.
- [x] Marcar todos os runbooks com nota `Status DocDoc`.
- [x] Revisar `docs/pm/*` como historico de gestao.
- [x] Criar indice DocDoc para `docs/e2e/*`.
- [x] Criar indice DocDoc para `docs/rls/*`.
- [x] Criar indice DocDoc para `docs/roadmaps/*`.
- [x] Criar indice DocDoc para `docs/design/*`.
- [x] Criar indice DocDoc para `docs/sql/*`.
- [x] Reconciliar indice DocDoc de `docs/adr/*`.
- [x] Mapear todos os Markdown raiz em `docs/`.
- [x] Criar ADR nova para a decisao mobile/web/admin como contrato arquitetural.

## Audits DocDoc

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/audits/README.md` | Atual | Indice vivo de auditorias, contratos e readiness. | Ler antes de usar auditorias antigas. |
| `docs/audits/CODEBASE_SCAN_GAP_CHECKLIST_2026-06-01.md` | Atual | Checklist de gaps/dividas para ticagem. | Nao substitui codigo, migrations ou CI. |
| `docs/audits/PMBOK_GAP_DEBT_CONTROL_PLAN_2026-06-01.md` | Atual | Plano PMBOK vivo para controlar gaps, dividas tecnicas, evidencias, aceite e sequenciamento de PRs. | Fonte operacional derivada da auditoria cruzada atual; nao pertence ao historico PM. |
| `docs/audits/OWNER_ID_RETIREMENT_INVENTORY_2026-06-01.md` | Atual | Inventario atual do G-005 para planejar retirada futura de `owner_id`. | Mantem `owner_id` como aberto controlado ate RLS Live Gate, preflight e PRs por dominio. |
| `docs/audits/OWNER_ID_ACTIVE_CONSUMERS_2026-06-01.md` | Atual | Inventario dos consumidores ativos dos helpers owner-only. | Identifica Admin como excecao ativa e bloqueia retorno das telas financeiras para helpers legados. |
| `docs/audits/ADMIN_ACCESS_CONTROL_OWNER_ID_RETIREMENT_CONTRACT.md` | Atual como contrato pre-runtime | Contrato para retirar `owner_id` de Admin/access-control. | Bloqueia runtime ate RLS Live Gate, fixture `__tests__/integration/rls/admin-multi-org.rls.test.ts`, modelo de convite/admin e rollback. |
| `docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md` | Atual como contrato com schema/preflight e runtime parcial | Contrato para substituir futuramente `ADMIN_EMAIL` por convite/admin por organizacao; `supabase/migrations/044_admin_invitations_schema.sql` cria armazenamento/RLS iniciais, `app/protected/admin/invitation-actions.ts` cobre criar, revogar, preparar reenvio e delivery compensatorio, `lib/admin-invitations/delivery.ts` cobre adapter server-only, `supabase/migrations/045_accept_admin_invitation_rpc.sql` + `app/auth/convite/actions.ts` cobrem aceite/linking, `app/auth/convite/page.tsx` + `components/admin-invitation-acceptance-form.tsx` cobrem a UI de aceite, e `supabase/migrations/046_admin_invitation_expiry_cleanup.sql` + `app/api/cron/admin-invitations/expire/route.ts` + `vercel.json` cobrem cron de expiracao. | Runtime final/remocao de `ADMIN_EMAIL` segue pendente; bloqueia remocao de `owner_id` ate convites, audit, rate limit e rollback existirem. |
| `docs/audits/ADMIN_INVITATION_DELIVERY_UI_CONTRACT.md` | Atual como contrato com delivery adapter, UI de aceite e cron de expiracao | Contrato para delivery server-only, UI de convite admin sem armazenar/logar/expor token bruto e cron service-role protegido por `CRON_SECRET`. | Remocao de `ADMIN_EMAIL` e owner_id retirement seguem pendentes; usar antes de qualquer troca de provider ou mudanca de tela `/auth/convite`. |
| `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md` | Atual | Contrato vigente do GAP-015. | Cruzar com `SAAS_GAP_REGISTER.md`. |
| `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md` | Atual como plano/registro | Plano do runtime de rate limit. | O contrato central define a leitura consolidada. |
| `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md` | Atual como plano/registro | Plano de audit events e write boundary. | Confirmar migrations atuais antes de operar. |
| `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md` | Atual como plano | Plano de retention. | Nao prova cleanup automatizado amplo. |
| `docs/audits/BILLING_WEBHOOK_RUNTIME_CONTRACT.md` | Atual como contrato pre-runtime | Requisitos do futuro webhook Stripe. | Webhook segue bloqueado ate evidencia real de checkout e portal. |
| `docs/audits/CLIENT_STATE_STRATEGY_CONTRACT.md` | Atual | Contrato vigente do GAP-019 para estado local, URL state, Server Actions, TanStack table e stores futuras. | Nao implementa runtime nem adiciona dependencia. |
| `docs/audits/DASHBOARD_VISUALIZATION_CONTRACT.md` | Atual | Contrato vigente do GAP-018 para graficos, series temporais e insights do dashboard. | Nao implementa runtime nem adiciona dependencia. |
| `docs/audits/DASHBOARD_UI_CONTRACT.md` | Atual | Contrato textual do dashboard. | Complementa guards, nao substitui teste visual. |
| `docs/audits/FINANCE_LIST_UI_CONTRACT.md` | Atual | Contrato textual das listas financeiras. | Complementa guards e permissao. |
| `docs/audits/FINANCE_FORM_UI_CONTRACT.md` | Atual | Contrato textual dos formularios financeiros. | Complementa server actions e RLS. |
| `docs/audits/SELECTIVE_VISUAL_SNAPSHOT_STRATEGY.md` | Atual | Estrategia de snapshot seletivo. | Evita snapshot amplo sem contrato. |
| `docs/audits/DASHBOARD_SUMMARY_VISUAL_FIXTURE.md` | Atual | Contrato e evidencia do primeiro snapshot visual seletivo. | Baseline restrito ao dashboard summary acima da dobra. |
| `docs/audits/ORGANIZATION_SCOPE_HARDENING_PLAN.md` | Parcialmente superado | Historico/controle do hardening `organization_id`. | Estado atual fica em migrations e `VALIDACAO_TECNICA.md`. |
| `docs/audits/LEGACY_ORGANIZATION_FALLBACK_REMOVAL_READINESS.md` | Parcialmente superado | Historico/controle da remocao de fallback legado. | Revalidar codigo antes de abrir novo PR baseado nele. |
| `docs/audits/*_ORGANIZATION_SCOPE_READINESS.md` | Parcialmente superado | Readiness por tabela. | Usar como contexto, nao como estado atual isolado. |
| `docs/audits/*_EVIDENCE*.md` | Historico/evidencia pontual | Prova de uma execucao ou revisao. | Refazer evidencia se a decisao for operacional. |

## Runbooks DocDoc

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/runbooks/README.md` | Atual | Indice vivo dos runbooks. | Ler antes de executar qualquer runbook antigo. |
| `docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md` | Atual | Runbook operacional para evidencia real de checkout e portal Stripe em teste. | Continua bloqueando webhook runtime ate evidencia real existir. |
| `docs/runbooks/LEGACY_ORGANIZATION_BACKFILL_RUNBOOK.md` | Parcialmente superado | Historico do processo seguro de backfill legado. | Nao usar as fases antigas como estado atual sem conferir migrations `020` a `043`. |
| `docs/runbooks/*_ORG_SCOPE_HARDENING.md` | Parcialmente superado/historico | Contexto e rollback das migrations de hardening. | Todos possuem nota DocDoc; confirmar estado atual em `VALIDACAO_TECNICA.md` e no banco alvo. |
| `docs/runbooks/*_RLS_FALLBACK_REMOVAL.md` | Parcialmente superado/historico | Contexto e rollback das migrations de fallback removal. | Todos possuem nota DocDoc; confirmar migrations e politicas atuais antes de executar SQL. |

## Audits DocDoc - contratos de produto

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/audits/ONBOARDING_TERMINOLOGY_CONTRACT.md` | Atual | Contrato vigente do GAP-016 para linguagem e UX do onboarding. | Runtime de copy inicial implementado; nao altera rota. |
| `docs/audits/NOTIFICATION_SCOPE_CONTRACT.md` | Atual | Contrato vigente do GAP-017 para alertas, canais e opt-in. | Nao implementa runtime, UI, cron, schema ou dependencia. |

## PM DocDoc

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/pm/README.md` | Atual | Indice vivo dos documentos PM. | Ler antes de usar PMBOK como contexto. |
| `docs/pm/01_TERMO_DE_ABERTURA.md` | Historico/PM | Contexto de abertura e objetivos originais. | Nao e contrato tecnico atual. |
| `docs/pm/02_ESCOPO.md` | Historico/PM | Contexto de escopo e exclusoes. | Nao e contrato tecnico atual. |
| `docs/pm/03_WBS_EAP.md` | Historico/PM | Estrutura analitica historica. | Nao e fila de execucao atual. |
| `docs/pm/04_REQUISITOS.md` | Historico/PM | Contexto de requisitos de produto. | Confirmar implementacao no codigo e `VALIDACAO_TECNICA.md`. |
| `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md` | Historico/PM | Contexto de riscos e mudancas. | Nao e evidencia atual de CI/runtime. |
| `docs/pm/06_ACEITE_ROADMAP.md` | Historico/PM | Contexto de aceite e roadmap original. | Nao e backlog tecnico atual. |
| `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md` | Historico/PM | Registro formal da mudanca SaaS. | Execucao atual fica em docs tecnicos. |
| `docs/pm/08_RELATORIO_PROGRESSO_SAAS_MULTI_TENANT.md` | Parcialmente superado | Relatorio de progresso de fase anterior. | Cruzar com `SAAS_GAP_REGISTER.md`. |

## E2E DocDoc

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/e2e/README.md` | Atual | Indice vivo dos contratos E2E. | Ler antes de alterar Playwright. |
| `docs/e2e/PLAYWRIGHT_COVERAGE_ROADMAP.md` | Atual como mapa de cobertura E2E | Matriz de cobertura e proxima sequencia segura. | Nao substitui specs ou CI. |
| `docs/e2e/PLAYWRIGHT_ONBOARDING_TESTS.md` | Atual como contrato gated | Fixtures e flags de onboarding/organizacao/shell. | Nao prova execucao gated atual. |
| `docs/e2e/DATA_CHANGING_CLEANUP_STRATEGY.md` | Atual como contrato de cleanup | Regras para E2E que muda dados. | Nao autoriza teste data-changing sem gate e cleanup. |

## RLS DocDoc

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/rls/README.md` | Atual | Indice vivo dos documentos RLS. | Ler antes de alterar RLS ou interpretar planos antigos. |
| `docs/rls/RLS_LIVE_GATE.md` | Atual como runbook/gate operacional | Workflow manual dedicado para validar RLS real. | Evidencia so existe apos run real bem-sucedido. |
| `docs/rls/ORGANIZATION_MEMBERSHIP_RLS_HELPERS.md` | Atual como contexto de helpers | Contexto dos helpers de membership. | Confirmar definicao real nas migrations e banco alvo. |
| `docs/rls/RLS_TEST_HARNESS.md` | Parcialmente superado | Contexto do desenho inicial do harness. | Confirmar tests reais atuais antes de usar. |
| `docs/rls/RLS_FINANCE_TEST_PLAN.md` | Parcialmente superado | Matriz historica inicial de testes RLS. | Confirmar cobertura atual em tests/inventarios. |
| `docs/rls/RLS_ROLLOUT_AND_ROLLBACK.md` | Parcialmente superado | Estrategia historica de rollout. | Nao usar como ordem atual isolada. |
| `docs/rls/LEGACY_ORGANIZATION_ID_HANDLING.md` | Parcialmente superado | Contexto do fallback legado. | Confirmar migrations `030` a `043` e policies atuais. |

## Roadmaps DocDoc

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/roadmaps/README.md` | Atual | Indice vivo dos roadmaps. | Ler antes de usar roadmaps como sequencia. |
| `docs/roadmaps/INITIAL_ORGANIZATION_ONBOARDING_FLOW.md` | Parcialmente superado/historico | Contexto do primeiro fluxo de onboarding de organizacao. | Nao usar como contrato atual para seletor de organizacao, multiplas memberships ou indice de uma membership ativa; ver migration `029` e `components/app/active-organization-indicator.tsx`. |
| `docs/roadmaps/LEGACY_FINANCE_HELPER_RETIREMENT.md` | Parcialmente superado/historico | Contexto da sequencia inicial de aposentadoria de helpers legados. | Nao usar como backlog atual isolado. |

## Design DocDoc

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/design/README.md` | Atual | Indice vivo dos contratos e direcoes de design. | Ler antes de usar specs antigas. |
| `docs/design/redesign-2026-ink-copper-ivory.md` | Atual como direcao visual em andamento | Fonte da direcao Ink + Copper + Ivory e tokens `--ff-*`. | Migration plan e historica por fase; conferir codigo atual antes de remigrar componentes. |
| `docs/design/VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md` | Parcialmente superado/historico | Baseline anterior e limites shadcn/ADR. | Nao usar como fonte atual de cores, superficies ou estilo do app protegido. |

## SQL DocDoc

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/sql/README.md` | Atual | Indice vivo das queries operacionais. | Ler antes de rodar qualquer SQL de `docs/sql`. |
| `docs/sql/*-null-preflight.sql` | Ferramenta operacional | Diagnostico/preflight de linhas com `organization_id` nulo. | Confirmar ambiente alvo e migrations atuais antes de executar. |
| `docs/sql/*-dry-run.sql` | Ferramenta operacional | Relatorios dry-run antes de backfill ou hardening. | Nao substitui migration, runbook ou evidencia. |
| `docs/sql/finance-relationships-orphan-preflight.sql` | Ferramenta operacional | Diagnostico de orfaos para relacionamentos financeiros da migration `043`. | Usar quando `043` falhar em validacao ou antes de retry/repair manual. |

## ADR DocDoc

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/adr/README.md` | Atual | Entrada historica do diretorio ADR. | Aponta para `DOCDOC_STATUS.md`. |
| `docs/adr/DOCDOC_STATUS.md` | Atual | Indice operacional dos ADRs. | Inclui a colisao historica dos dois `0006`; proximos ADRs comecam em `0010`. |
| `docs/adr/0001-*.md` a `docs/adr/0008-*.md` | Historico decisorio | Contexto de decisoes aceitas. | Nao reescrever decisao aceita; criar novo ADR se a decisao mudar. |
| `docs/adr/0009-mobile-channel-boundary.md` | Historico decisorio aceito | Contrato de canal web admin/operacional atual e app nativo futuro. | Nao usar estrategia mobile como evidencia de app implementado. |
| `docs/adr/TEMPLATE.md` | Template | Modelo para novos ADRs. | Manter sem status de decisao. |

## Regras de reconciliacao

- Nao apagar documento sem substituto claro.
- Nao transformar proposta em evidencia.
- Nao usar plano antigo para contrariar codigo/migration atual.
- Nao misturar DocDoc com mudanca de produto.
- Cada PR DocDoc deve ter escopo pequeno, status atualizado e guard focado.
