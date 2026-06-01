# PM - Status DocDoc

> Status DocDoc: Atual
> Uso atual: indice vivo para separar documentacao PMBOK/historica de
> contratos tecnicos atuais.
> Atualizado em: 2026-06-01.

## Como usar

Use estes documentos como contexto de gestao, escopo, requisitos originais,
risco, aceite e historico da mudanca SaaS. Eles nao substituem:

1. codigo, migrations e workflows versionados na `main`;
2. `docs/VALIDACAO_TECNICA.md`;
3. `docs/SAAS_GAP_REGISTER.md`;
4. `docs/DOCUMENTATION_STATUS.md`;
5. ADRs vigentes em `docs/adr/`.

## Documentos PM

| Documento | Status DocDoc | Uso seguro |
| --- | --- | --- |
| `01_TERMO_DE_ABERTURA.md` | Historico/PM | Contexto de abertura e objetivos originais. |
| `02_ESCOPO.md` | Historico/PM | Contexto de escopo e exclusoes originais. |
| `03_WBS_EAP.md` | Historico/PM | Estrutura analitica historica do trabalho. |
| `04_REQUISITOS.md` | Historico/PM | Requisitos de produto como contexto; confirmar estado atual no codigo e em `VALIDACAO_TECNICA.md`. |
| `05_RISCOS_QUALIDADE_MUDANCAS.md` | Historico/PM | Registro de riscos/qualidade/mudancas, nao evidencias atuais. |
| `06_ACEITE_ROADMAP.md` | Historico/PM | Criterios e roadmap originais, nao fila tecnica atual. |
| `07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md` | Historico/PM | Registro formal da mudanca SaaS; a execucao atual fica em docs tecnicos. |
| `08_RELATORIO_PROGRESSO_SAAS_MULTI_TENANT.md` | Parcialmente superado | Relatorio de progresso de uma fase anterior; cruzar com `SAAS_GAP_REGISTER.md`. |

## Regra operacional

Documentos PM podem orientar produto e memoria de decisao, mas nao devem ser
usados para:

- afirmar estado atual de migrations;
- provar runtime, RLS, CI ou deploy;
- abrir PR tecnico sem cruzar com codigo e documentos tecnicos atuais;
- substituir um ADR quando a decisao for arquitetural.
