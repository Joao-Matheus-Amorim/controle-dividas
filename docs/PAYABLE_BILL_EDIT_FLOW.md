# Edicao completa de contas e dividas

## Objetivo

Permitir que o usuario edite uma conta/divida existente sem precisar excluir e cadastrar novamente.

Esta etapa evolui o modulo `Contas a pagar / Dividas`, que ja possuia criacao, status, filtros, tipos fixa/avulsa, exclusao e dashboard.

## O que pode ser editado

- Nome da conta/divida;
- categoria;
- valor;
- data de vencimento;
- responsavel;
- status;
- tipo: `avulsa` ou `fixa`;
- banco utilizado;
- recorrencia;
- observacao.

## Regras de permissao

A edicao respeita `can_edit` no modulo `CONTAS_A_PAGAR`.

Regras aplicadas:

- o usuario precisa ter permissao de edicao sobre o responsavel atual da conta;
- se o responsavel for alterado, o usuario tambem precisa ter permissao de edicao sobre o novo responsavel;
- a atualizacao continua limitada ao `owner_id` da familia atual.

## Regras de tipo

| Tipo | Regra |
| --- | --- |
| `avulsa` | Nao grava recorrencia |
| `fixa` | Grava recorrencia; se vazia, usa `mensal` |

## Arquivos principais

```txt
app/protected/contas-a-pagar/actions.ts
components/finance/payable-bill-form.tsx
components/finance/payable-bill-edit-dialog.tsx
app/protected/contas-a-pagar/page.tsx
```

## Testes

Arquivo adicionado:

```txt
__tests__/unit/payable-bill-edit-actions.test.ts
```

Cobre:

- edicao completa de campos;
- bloqueio de edicao sem `id`.

## Fora do escopo

- historico de alteracoes;
- confirmacao visual avancada;
- feedback global via toast;
- recorrencia personalizada completa;
- geracao automatica de proximas parcelas.
