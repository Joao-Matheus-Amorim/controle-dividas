# Runbooks - Status DocDoc

> Status DocDoc: Atual
> Uso atual: indice vivo para separar runbooks operacionais atuais de runbooks
> historicos usados como contexto, rollback ou evidencia de sequencias antigas.
> Atualizado em: 2026-06-01.

## Como usar

Use este arquivo antes de executar qualquer runbook. A hierarquia atual e:

1. codigo, migrations e workflows versionados na `main`;
2. `docs/VALIDACAO_TECNICA.md`;
3. `docs/SAAS_GAP_REGISTER.md`;
4. `docs/DOCUMENTATION_STATUS.md`;
5. este indice para documentos em `docs/runbooks`.

Runbook antigo nao e autorizacao automatica para aplicar SQL, rollback ou
mudanca de ambiente. Antes de executar, confirme o estado atual do banco alvo,
da branch e das secrets.

## Runbook operacional atual

| Documento | Status DocDoc | Uso seguro |
| --- | --- | --- |
| `BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md` | Atual | Criar/configurar conta Stripe em modo teste e capturar evidencia real de checkout e portal antes de qualquer webhook runtime. |

## Runbooks parcialmente superados

| Documento | Status DocDoc | Uso seguro |
| --- | --- | --- |
| `LEGACY_ORGANIZATION_BACKFILL_RUNBOOK.md` | Parcialmente superado | Historico do processo seguro de backfill legado; nao usar as fases antigas como estado atual sem validar migrations `020` a `043`. |
| `*_ORG_SCOPE_HARDENING.md` | Parcialmente superado/historico | Contexto e rollback das migrations de hardening `020` a `028`; confirmar estado atual em `VALIDACAO_TECNICA.md`. |
| `*_RLS_FALLBACK_REMOVAL.md` | Parcialmente superado/historico | Contexto e rollback das migrations de fallback removal `030` a `039`; confirmar estado atual em migrations e banco alvo. |

## Regras operacionais

Antes de executar um runbook:

- confirme que o documento esta marcado como `Atual`;
- confirme que a migration citada ainda e a migration certa para o ambiente;
- confirme que o banco alvo esta no mesmo range de migrations esperado;
- registre evidencia antes/depois quando a acao for operacional;
- nao rode SQL de rollback copiado de runbook historico sem revisar contra o
  schema atual.

Quando houver conflito entre um runbook e o estado de `main`, trate o runbook
como historico e abra um PR DocDoc pequeno antes de operar.
