# Documentacao FamilyFinance

> Status DocDoc: Atual
> Uso atual: porta de entrada para decidir qual documento usar primeiro.
> Regra: documentos antigos nao devem ser apagados por padrao; devem ser
> marcados como superados, parcialmente superados, historicos ou proposta.

## Leia primeiro

| Documento | Uso |
| --- | --- |
| `docs/VALIDACAO_TECNICA.md` | Contrato operacional atual: stack, envs, CI, deploy, migrations e validacao tecnica. |
| `docs/SAAS_GAP_REGISTER.md` | Registro vivo de gaps e proximos riscos. |
| `docs/audits/CODEBASE_SCAN_GAP_CHECKLIST_2026-06-01.md` | Checklist de varredura tecnica para ir fechando dividas uma a uma. |
| `docs/DOCUMENTATION_STATUS.md` | Mapa DocDoc de status, superacoes e uso seguro de documentos. |
| `docs/adr/README.md` | Indice de decisoes arquiteturais. ADRs sao historico decisorio, nao checklist operacional. |

## Contratos por area

| Area | Documento atual |
| --- | --- |
| Validacao tecnica e deploy | `docs/VALIDACAO_TECNICA.md` |
| Gaps SaaS | `docs/SAAS_GAP_REGISTER.md` |
| Checklist tecnico ativo | `docs/audits/CODEBASE_SCAN_GAP_CHECKLIST_2026-06-01.md` |
| Design system atual | `docs/design/VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md` e `docs/design/redesign-2026-ink-copper-ivory.md` |
| Mobile e canais | `docs/MOBILE_STRATEGY.md` e `docs/MOBILE_FIRST_UX.md` |
| Billing | `docs/audits/BILLING_*`, `docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md` e `docs/adr/0008-billing-plan-contract-before-stripe.md` |
| RLS e Supabase | `docs/VALIDACAO_TECNICA.md`, `docs/rls/*`, `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md` |
| Historico de PM/escopo | `docs/pm/*` |

## Como tratar documento antigo

Use notas DocDoc no topo do arquivo:

```md
> Status DocDoc: Parcialmente superado
> Superado por: docs/VALIDACAO_TECNICA.md
> Uso atual: referencia historica; nao usar como contrato operacional atual.
```

Status permitidos:

- `Atual`: pode orientar trabalho novo.
- `Parcialmente superado`: contem contexto util, mas deve ser cruzado com o documento indicado.
- `Superado`: nao usar como fonte de verdade para implementacao atual.
- `Historico`: manter para auditoria, PM, ADR ou runbook ja executado.
- `Proposta`: direcionamento ou estrategia ainda nao implementada.

## Regra para agentes

Antes de alterar produto, CI, Supabase, billing ou design, confirmar se o
documento lido e `Atual` ou se foi superado por outro documento. Quando houver
conflito, prevalece:

1. codigo e migrations atuais;
2. `docs/VALIDACAO_TECNICA.md`;
3. `docs/SAAS_GAP_REGISTER.md`;
4. checklist tecnico ativo;
5. ADR mais recente aplicavel;
6. documentos historicos/propostas.

Todo PR que fecha ou reduz gap, bloco ou funcionalidade deve atualizar a
documentacao viva correspondente no mesmo escopo. No minimo, conferir
`docs/SAAS_GAP_REGISTER.md`, `docs/VALIDACAO_TECNICA.md`,
`docs/SAAS_OPERATIONAL_ROADMAP.md`, os indices DocDoc e o contrato/auditoria da
area tocada.

Decisao arquitetural, mudanca de rota, troca de boundary ou alteracao de
compatibilidade deve ter ADR ou registro decisorio proprio antes do runtime.
