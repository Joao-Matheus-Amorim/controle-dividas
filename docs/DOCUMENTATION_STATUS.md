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
| `docs/audits/` | Misto | Auditorias recentes podem ser atuais; readiness antigos podem estar historicos. Sempre conferir status e data. |
| `docs/design/` | Atual para design system | Fonte para tokens e direcao visual atual. |
| `docs/e2e/` | Parcialmente superado | Usar como contexto de estrategia E2E; conferir CI atual. |
| `docs/pm/` | Historico/PM | Contexto de escopo e gestao, nao contrato tecnico atual. |
| `docs/rls/` | Misto | Contexto e runbooks RLS; validar contra migrations atuais. |
| `docs/roadmaps/` | Historico/planejamento | Nao usar como evidencia de implementacao. |
| `docs/runbooks/` | Runbook/historico | Executar apenas quando ainda aplicavel e cruzado com estado atual. |
| `docs/sql/` | Ferramentas operacionais | Queries de preflight/diagnostico; revisar antes de rodar em producao. |

## Fila DocDoc inicial

- [x] Criar entrada `docs/README.md`.
- [x] Criar mapa `docs/DOCUMENTATION_STATUS.md`.
- [x] Salvar skill `.agents/skills/operacao-docdoc/SKILL.md`.
- [x] Marcar documentos centrais com notas DocDoc.
- [ ] Revisar `docs/audits/*` em lotes pequenos.
- [ ] Revisar `docs/runbooks/*` em lotes pequenos.
- [ ] Revisar `docs/pm/*` como historico de gestao.
- [ ] Criar ADR nova se alguma decisao mobile/web/admin precisar virar contrato arquitetural.

## Regras de reconciliacao

- Nao apagar documento sem substituto claro.
- Nao transformar proposta em evidencia.
- Nao usar plano antigo para contrariar codigo/migration atual.
- Nao misturar DocDoc com mudanca de produto.
- Cada PR DocDoc deve ter escopo pequeno, status atualizado e guard focado.
