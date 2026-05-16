# Resolucao dos comentarios do Copilot/Codex

## Objetivo

Registrar como os comentarios de review do Copilot/Codex foram tratados no projeto, sem apagar historico nem substituir as documentacoes existentes.

## Comentarios tratados

| Origem | Tema | Decisao |
| --- | --- | --- |
| PR #15 | Conta fixa aceitava recorrencia diferente de mensal | Corrigido: conta fixa sempre grava `mensal` nesta fase |
| PR #18 | Error boundary usava `reset` | Corrigido: `app/protected/error.tsx` usa `unstable_retry` |
| PR #28 | Confirmacao de exclusao de conta/divida nao resetava ao reabrir | Corrigido: dialog controla `open` e reseta `isConfirmed` ao fechar |
| PR #30 | `members` e `categories` eram passados em cada linha de gasto | Corrigido: lista de gastos usa um componente client unico |
| PR #32 | Dialog compartilhado de exclusao de gasto mantinha estado antigo | Corrigido: estado de exclusao e confirmacao e limpo ao fechar/submeter |

## Regras consolidadas

### Contas a pagar / Dividas

- `bill_type = 'avulsa'` representa conta/divida pontual.
- `bill_type = 'fixa'` representa conta fixa mensal nesta fase.
- Conta fixa sempre grava `recurrence = 'mensal'`.
- Conta avulsa nao grava recorrencia.
- Exclusao exige confirmacao explicita.
- Confirmacao de exclusao sempre reseta quando o dialog fecha.

### Gastos

- A lista de gastos usa um componente client unico para evitar duplicar `members` e `categories` por linha.
- O dialog de edicao usa estado client compartilhado.
- O dialog de exclusao usa estado client compartilhado.
- Ao fechar ou submeter exclusao, o estado de exclusao e a confirmacao sao limpos.

### Error boundary

- A tela protegida de erro usa `unstable_retry` no botao `Tentar novamente`.
- A decisao esta documentada em `docs/ERROR_BOUNDARY_RETRY.md`.

## Documentos atualizados

- `docs/PAYABLE_BILLS_AS_DEBTS.md`
- `docs/PAYABLE_BILL_ACTION_FEEDBACK.md`
- `docs/EXPENSE_EDIT_FEEDBACK.md`
- `docs/EXPENSE_LIST_OPTIMIZATION.md`
- `docs/ERROR_BOUNDARY_RETRY.md`

## Fora do escopo

- Toast global.
- Historico/auditoria de alteracoes.
- Restauracao de itens excluidos.
- Recorrencia personalizada completa.
- Virtualizacao/paginacao da lista de gastos.
