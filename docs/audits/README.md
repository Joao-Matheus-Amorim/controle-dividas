# Audits - Status DocDoc

> Status DocDoc: Atual
> Uso atual: indice vivo para separar contratos vigentes, planos pre-runtime,
> readiness parcialmente superados e evidencias historicas em `docs/audits`.
> Atualizado em: 2026-06-01.

## Como usar

Use este arquivo antes de seguir qualquer auditoria antiga. A hierarquia atual e:

1. codigo, migrations e workflows versionados na `main`;
2. `docs/VALIDACAO_TECNICA.md`;
3. `docs/SAAS_GAP_REGISTER.md`;
4. `docs/DOCUMENTATION_STATUS.md`;
5. este indice para documentos em `docs/audits`.

Se um documento de auditoria contradiz os itens acima, trate a auditoria como
historica ate reconciliar o status.

## Contratos atuais

| Documento | Uso seguro |
| --- | --- |
| `CODEBASE_SCAN_GAP_CHECKLIST_2026-06-01.md` | Checklist operacional para gaps e dividas tecnicas abertas. |
| `PMBOK_GAP_DEBT_CONTROL_PLAN_2026-06-01.md` | Plano PMBOK vivo para controlar gaps, dividas tecnicas, evidencias, aceite e sequenciamento de PRs. |
| `OWNER_ID_RETIREMENT_INVENTORY_2026-06-01.md` | Inventario atual do G-005 para planejar retirada futura de `owner_id` sem falso verde. |
| `OWNER_ID_ACTIVE_CONSUMERS_2026-06-01.md` | Inventario dos consumidores ativos dos helpers owner-only antes de qualquer retirada de `owner_id`. |
| `ADMIN_ACCESS_CONTROL_OWNER_ID_RETIREMENT_CONTRACT.md` | Contrato pre-runtime para retirar `owner_id` de Admin/access-control sem falso verde. |
| `ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md` | Contrato pre-runtime para substituir futuramente `ADMIN_EMAIL` por convite/admin por organizacao sem falso verde. |
| `ADMIN_INVITATION_DELIVERY_UI_CONTRACT.md` | Contrato com delivery adapter parcial para delivery server-only e UI futura de convite admin sem armazenar, logar ou expor token bruto. |
| `ONBOARDING_TERMINOLOGY_CONTRACT.md` | Contrato vigente do GAP-016 para linguagem do onboarding e adocao inicial de copy runtime. |
| `NOTIFICATION_SCOPE_CONTRACT.md` | Contrato vigente do GAP-017 para alertas, canais e opt-in antes de notificacoes runtime. |
| `SENSITIVE_OPERATION_CONTROLS_CONTRACT.md` | Contrato vigente do GAP-015 para rate limit, audit runtime e retention. |
| `SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md` | Plano/registro do runtime de rate limit; cruzar com o contrato central antes de abrir novo PR. |
| `SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md` | Plano/contrato do schema e write boundary de audit events. |
| `SENSITIVE_DATA_RETENTION_PLAN.md` | Plano de retention; nao usar como evidencia de cleanup automatizado amplo. |
| `BILLING_WEBHOOK_RUNTIME_CONTRACT.md` | Contrato pre-runtime do futuro webhook Stripe; webhook segue bloqueado ate evidencia real de checkout e portal. |
| `CLIENT_STATE_STRATEGY_CONTRACT.md` | Contrato vigente do GAP-019 para escolher estado local, URL state, Server Actions, TanStack table e stores futuras. |
| `DASHBOARD_VISUALIZATION_CONTRACT.md` | Contrato vigente do GAP-018 para graficos, series temporais e insights do dashboard antes de charting. |
| `DASHBOARD_UI_CONTRACT.md` | Contrato textual vigente do dashboard. |
| `FINANCE_LIST_UI_CONTRACT.md` | Contrato textual vigente das listas financeiras primarias. |
| `FINANCE_FORM_UI_CONTRACT.md` | Contrato textual vigente dos formularios financeiros primarios. |
| `SELECTIVE_VISUAL_SNAPSHOT_STRATEGY.md` | Estrategia vigente de snapshot visual seletivo. |
| `DASHBOARD_SUMMARY_VISUAL_FIXTURE.md` | Contrato e evidencia do primeiro snapshot visual seletivo do dashboard summary acima da dobra. |
| `CURRENT_RLS_POLICIES_INVENTORY.md` | Inventario de leitura; validar contra migrations e banco alvo antes de decisao operacional. |

## Readiness parcialmente superados

Estes documentos ainda explicam a ordem e os criterios usados, mas nao devem ser
tratados como estado atual sem cruzar com migrations `020` a `043`,
`VALIDACAO_TECNICA.md` e `SAAS_GAP_REGISTER.md`.

| Documento | Uso seguro |
| --- | --- |
| `ORGANIZATION_SCOPE_HARDENING_PLAN.md` | Historico/controle da sequencia de hardening de `organization_id`. |
| `LEGACY_ORGANIZATION_FALLBACK_REMOVAL_READINESS.md` | Historico/controle da remocao gradual do fallback legado. |
| `LEGACY_ORGANIZATION_NULL_BACKFILL_READINESS.md` | Readiness do backfill legado; nao usar como estado atual de producao. |
| `LEGACY_ORGANIZATION_NULL_PRODUCTION_EVIDENCE.md` | Evidencia pontual historica; precisa ser refeita se usada operacionalmente. |
| `PROFILES_READINESS.md` e `PROFILES_EVIDENCE_STATUS.md` | Contexto da etapa de profiles; validar contra schema e runtime atuais. |
| `*_ORGANIZATION_SCOPE_READINESS.md` | Readiness por tabela; util para auditoria, nao para afirmar estado atual sem validacao. |
| `OWNER_ID_FINANCE_QUERIES_AUDIT.md` | Auditoria historica do modelo transicional `owner_id`. |
| `FINANCE_SERVER_BOUNDARIES_AUDIT.md` | Contexto de modularizacao; usar `docs/adr/0006-finance-server-facade-boundary.md` para decisao vigente. |

## Evidencia e propostas

Documentos de evidencia, inventario ou proposta devem continuar no historico,
mas nao podem ser usados como prova de runtime atual sem nova verificacao:

- `ADMIN_BOOTSTRAP_ONBOARDING_AUDIT.md`;
- `ADMIN_PERMISSIONS_MULTI_ORG_AUDIT.md`;
- `FIRST_ORGANIZATION_RUNTIME_ONBOARDING_AUDIT.md`;
- `FINANCIAL_RLS_GATE4_READINESS.md`;
- `POST_RLS_HARNESS_TECHNICAL_DEBT_AUDIT.md`;
- `PRODUCTION_ENV_FAIL_FAST_AUDIT.md`;
- `USER_FEATURE_PERMISSIONS_WRITE_PATH_AUDIT.md`;
- `VISUAL_REDESIGN_READINESS_AFTER_SHEET.md`.

## Regra operacional

Nao abra PR a partir de uma auditoria antiga sem primeiro registrar se ela esta:

- `Atual`;
- `Parcialmente superado`;
- `Superado`;
- `Historico`;
- `Proposta`.

Quando o estado nao estiver claro, crie um PR DocDoc pequeno para reconciliar o
status antes de mudar codigo, migration, RLS, CI ou deploy.
