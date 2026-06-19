# RLS - Status DocDoc

> Status DocDoc: Atual
> Uso atual: indice vivo para separar gate operacional, contratos de teste e
> planos historicos/parcialmente superados de RLS.
> Atualizado em: 2026-06-01.

## Como usar

Use estes documentos como contexto de seguranca e validacao RLS. Eles nao
substituem:

1. migrations versionadas;
2. policies reais no banco alvo;
3. specs em `__tests__/integration/rls`;
4. execucoes do workflow `RLS Live Gate`;
5. `docs/VALIDACAO_TECNICA.md`;
6. `docs/SAAS_GAP_REGISTER.md`.

## Documentos RLS

| Documento | Status DocDoc | Uso seguro |
| --- | --- | --- |
| `RLS_LIVE_GATE.md` | Atual como runbook/gate operacional | Como configurar e executar o workflow manual de RLS contra ambiente dedicado. |
| `RLS_TEST_HARNESS.md` | Parcialmente superado | Contexto do desenho inicial do harness; validar contra os testes reais atuais. |
| `RLS_FINANCE_TEST_PLAN.md` | Parcialmente superado | Matriz historica inicial; confirmar cobertura em tests e inventarios atuais. |
| `RLS_ROLLOUT_AND_ROLLBACK.md` | Parcialmente superado | Estrategia historica de rollout; usar como contexto, nao como ordem atual. |
| `LEGACY_ORGANIZATION_ID_HANDLING.md` | Parcialmente superado | Contexto do fallback legado; confirmar com migrations `030` a `067`. |
| `ORGANIZATION_MEMBERSHIP_RLS_HELPERS.md` | Atual como contexto de helpers | Contexto dos helpers existentes; confirmar definicao nas migrations antes de alterar policies. |

## Regra operacional

Nao use documentos RLS para afirmar que isolamento esta provado. Prova atual
exige:

- migration/policy versionada;
- teste ou guard correspondente;
- execucao local/CI/gated aplicavel;
- evidencia do banco alvo quando a decisao depender de ambiente real.

O `RLS Live Gate` e manual e dedicado. Ele nao deve ser ligado ao CI padrao sem
nova decisao explicita.
