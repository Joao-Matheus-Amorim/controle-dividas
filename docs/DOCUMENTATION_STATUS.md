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

## Diretorios

| Diretorio | Status DocDoc | Uso seguro |
| --- | --- | --- |
| `docs/adr/` | Historico decisorio | Manter ADRs; criar nova ADR para decisao nova ou mudanca estrutural. |
| `docs/audits/` | Misto com indice atual | Usar `docs/audits/README.md` antes de seguir auditorias antigas. Contratos atuais e readiness historicos ficam separados ali. |
| `docs/design/` | Atual para design system | Fonte para tokens e direcao visual atual. |
| `docs/e2e/` | Atual com indice | Usar `docs/e2e/README.md` como entrada para contratos E2E. Roadmaps nao substituem specs, CI ou evidencia gated. |
| `docs/pm/` | Historico/PM com indice atual | Usar `docs/pm/README.md` como entrada. Contexto de gestao, nao contrato tecnico atual. |
| `docs/rls/` | Misto com indice atual | Usar `docs/rls/README.md` como entrada. Live Gate segue operacional; planos antigos precisam ser cruzados com migrations e testes atuais. |
| `docs/roadmaps/` | Misto com indice atual | Usar `docs/roadmaps/README.md` como entrada. Roadmaps orientam sequencia, mas nao provam implementacao. |
| `docs/runbooks/` | Misto com indice atual | Usar `docs/runbooks/README.md` antes de executar runbooks antigos. Stripe evidence segue atual; hardening/fallback runbooks sao majoritariamente historicos. |
| `docs/sql/` | Ferramentas operacionais | Queries de preflight/diagnostico; revisar antes de rodar em producao. |

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
- [ ] Criar ADR nova se alguma decisao mobile/web/admin precisar virar contrato arquitetural.

## Audits DocDoc

| Documento | Status DocDoc | Uso seguro | Observacao |
| --- | --- | --- | --- |
| `docs/audits/README.md` | Atual | Indice vivo de auditorias, contratos e readiness. | Ler antes de usar auditorias antigas. |
| `docs/audits/CODEBASE_SCAN_GAP_CHECKLIST_2026-06-01.md` | Atual | Checklist de gaps/dividas para ticagem. | Nao substitui codigo, migrations ou CI. |
| `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md` | Atual | Contrato vigente do GAP-015. | Cruzar com `SAAS_GAP_REGISTER.md`. |
| `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md` | Atual como plano/registro | Plano do runtime de rate limit. | O contrato central define a leitura consolidada. |
| `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md` | Atual como plano/registro | Plano de audit events e write boundary. | Confirmar migrations atuais antes de operar. |
| `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md` | Atual como plano | Plano de retention. | Nao prova cleanup automatizado amplo. |
| `docs/audits/BILLING_WEBHOOK_RUNTIME_CONTRACT.md` | Atual como contrato pre-runtime | Requisitos do futuro webhook Stripe. | Webhook segue bloqueado ate evidencia real de checkout e portal. |
| `docs/audits/DASHBOARD_UI_CONTRACT.md` | Atual | Contrato textual do dashboard. | Complementa guards, nao substitui teste visual. |
| `docs/audits/FINANCE_LIST_UI_CONTRACT.md` | Atual | Contrato textual das listas financeiras. | Complementa guards e permissao. |
| `docs/audits/FINANCE_FORM_UI_CONTRACT.md` | Atual | Contrato textual dos formularios financeiros. | Complementa server actions e RLS. |
| `docs/audits/SELECTIVE_VISUAL_SNAPSHOT_STRATEGY.md` | Atual | Estrategia de snapshot seletivo. | Evita snapshot amplo sem contrato. |
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

## Regras de reconciliacao

- Nao apagar documento sem substituto claro.
- Nao transformar proposta em evidencia.
- Nao usar plano antigo para contrariar codigo/migration atual.
- Nao misturar DocDoc com mudanca de produto.
- Cada PR DocDoc deve ter escopo pequeno, status atualizado e guard focado.
