# Roadmaps - Status DocDoc

> Status DocDoc: Atual
> Uso atual: indice vivo para separar roadmaps vigentes, parcialmente superados
> e historicos.
> Atualizado em: 2026-06-01.

## Como usar

Use estes documentos como contexto de sequenciamento e decisao historica. Eles
nao substituem:

1. codigo, migrations e workflows versionados na `main`;
2. ADRs vigentes;
3. `docs/VALIDACAO_TECNICA.md`;
4. `docs/SAAS_GAP_REGISTER.md`;
5. `docs/DOCUMENTATION_STATUS.md`.

## Documentos Roadmaps

| Documento | Status DocDoc | Uso seguro |
| --- | --- | --- |
| `INITIAL_ORGANIZATION_ONBOARDING_FLOW.md` | Parcialmente superado/historico | Contexto do primeiro fluxo de onboarding de organizacao; nao usar como contrato atual para seletor de organizacao, multiplas memberships ou indice de uma membership ativa. |
| `LEGACY_FINANCE_HELPER_RETIREMENT.md` | Parcialmente superado/historico | Contexto da sequencia inicial de aposentadoria de helpers legados; nao usar como backlog atual sem cruzar com o estado de `main`. |

## Regra operacional

Roadmaps orientam sequenciamento, mas nao sao evidencia de implementacao. Antes
de abrir PR tecnico com base neles, confirme o estado atual em codigo, testes,
docs centrais e ADRs.
