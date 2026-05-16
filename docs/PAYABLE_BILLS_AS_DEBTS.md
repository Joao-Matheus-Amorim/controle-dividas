# Contas a pagar como dividas no MVP

## Decisao

No MVP, o modulo existente de **Contas a pagar** sera o nucleo operacional de **Dividas**.

Nao criaremos um modulo separado de Dividas nesta fase. A decisao aproveita o que ja existe no projeto: cadastro, vencimento, responsavel, status, permissao por membro, totais, dashboard e proximos vencimentos.

## Tipos de conta/divida

O modulo passa a trabalhar com dois tipos:

| Tipo | Uso | Recorrencia |
| --- | --- | --- |
| `avulsa` | Pagamento pontual, boleto eventual, compra especifica ou divida sem repeticao | Sem recorrencia obrigatoria |
| `fixa` | Conta recorrente, como aluguel, internet, escola, assinatura ou financiamento | Mensal obrigatoria nesta fase |

## Regra atual do MVP

- Toda conta avulsa fica com `bill_type = 'avulsa'`.
- Toda conta fixa fica com `bill_type = 'fixa'`.
- Conta fixa sempre grava `recurrence = 'mensal'` nesta fase do MVP.
- Conta avulsa sempre grava `recurrence = null`.
- Qualquer valor de recorrencia diferente de `mensal` enviado pelo formulario ou por request manual e ignorado enquanto recorrencia personalizada nao existir.
- Recorrencia personalizada fica preparada para uma fase futura, mas ainda esta fora do escopo atual.

## Banco de dados

A migration `005_payable_bill_types.sql` adiciona o campo:

```sql
bill_type text not null default 'avulsa'
```

Tambem adiciona a constraint:

```sql
check (bill_type in ('avulsa', 'fixa'))
```

E preserva contas antigas:

- contas com `recurrence` preenchida passam a ser tratadas como `fixa`;
- contas sem `recurrence` continuam como `avulsa`.

## Interface

A tela de `Contas a pagar` comunica o objetivo do modulo como **Contas e dividas**.

Ela exibe:

- conta avulsa;
- conta fixa;
- total de avulsas;
- total de fixas;
- badges na listagem indicando o tipo;
- filtros por status;
- filtros por tipo;
- estado vazio quando nao ha contas cadastradas;
- estado vazio quando filtros nao encontram resultados.

## Status

Os status atuais continuam sendo:

| Status | Significado |
| --- | --- |
| `pendente` | Conta ainda em aberto |
| `pago` | Conta quitada |
| `atrasado` | Conta vencida ou marcada como atrasada |

O app tambem calcula atraso quando a conta nao esta paga e a data de vencimento ja passou.

## Filtros da listagem

A listagem permite combinar filtros por status e tipo usando query params:

```txt
/protected/contas-a-pagar?status=pendente
/protected/contas-a-pagar?status=atrasado
/protected/contas-a-pagar?status=pago
/protected/contas-a-pagar?tipo=avulsa
/protected/contas-a-pagar?tipo=fixa
/protected/contas-a-pagar?status=pendente&tipo=fixa
```

Valores invalidos voltam para os filtros padrao:

```txt
status=todos
tipo=todas
```

## Edicao e exclusao

O modulo tambem possui:

- edicao completa de conta/divida;
- alteracao de status com feedback;
- confirmacao obrigatoria antes de excluir;
- reset da confirmacao de exclusao ao fechar/reabrir o dialog;
- revalidacao de `/protected/contas-a-pagar` e `/protected` apos mudancas.

## Fora do escopo desta fase

- Modulo separado `/protected/dividas`;
- recorrencia personalizada completa;
- geracao automatica de proximas parcelas;
- historico de alteracoes;
- restauracao de item excluido.

Esses pontos podem evoluir em Issues futuras.
