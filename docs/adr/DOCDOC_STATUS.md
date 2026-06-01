# ADR - Status DocDoc

> Status DocDoc: Atual
> Uso atual: indice operacional para reconciliar ADRs sem reescrever decisoes
> historicas.
> Atualizado em: 2026-06-01.

## Regra

ADRs aceitos registram decisoes no tempo. Quando uma decisao muda, crie um novo
ADR e marque o anterior como substituido; nao edite o texto historico para
parecer que a decisao antiga nunca existiu.

## Arquivos

| Arquivo | Status DocDoc | Uso seguro |
| --- | --- | --- |
| `0001-saas-first-production-positioning.md` | Historico decisorio aceito | Contexto da virada SaaS-first. |
| `0002-active-organization-ux-before-orgslug-routes.md` | Historico decisorio aceito | Contexto da UX de organizacao ativa antes de orgSlug. |
| `0003-design-system-and-shadcn-adoption.md` | Historico decisorio aceito | Contrato de adocao shadcn/design system por camadas. |
| `0004-initial-organization-onboarding-boundary.md` | Historico decisorio aceito | Contexto do onboarding explicito da primeira organizacao. |
| `0005-onboarding-route-layout-strategy.md` | Historico decisorio aceito | Contexto do layout separado de onboarding. |
| `0006-current-saas-transition-architecture.md` | Historico decisorio parcialmente superado | Contexto da arquitetura transicional; cruzar com `docs/VALIDACAO_TECNICA.md` e `docs/SAAS_GAP_REGISTER.md`. |
| `0006-finance-server-facade-boundary.md` | Historico decisorio aceito | Contexto do facade `lib/finance/server.ts`. |
| `0007-orgslug-routing-contract.md` | Historico decisorio aceito | Contrato de rotas `/org/[orgSlug]` com `/protected` como compatibilidade. |
| `0008-billing-plan-contract-before-stripe.md` | Historico decisorio aceito | Contrato local de planos antes do runtime Stripe completo. |
| `DOCDOC_STATUS.md` | Atual | Indice operacional dos ADRs. |
| `README.md` | Atual | Entrada historica do diretorio ADR. |
| `TEMPLATE.md` | Template | Modelo para novos ADRs. |

## Nota sobre numeracao

Ha dois ADRs com prefixo `0006`. Isso fica preservado como historico para evitar
renomear decisoes ja versionadas. Proximos ADRs devem usar o proximo numero
livre apos `0008`, comecando em `0009`.
