# Contas a pagar como dividas no MVP

## Decisao

No MVP, o modulo existente de **Contas a pagar** sera o nucleo operacional de **Dividas**.

Nao criaremos um modulo separado de Dividas nesta fase. A decisao aproveita o que ja existe no projeto: cadastro, vencimento, responsavel, status, permissao por membro, totais, dashboard e proximos vencimentos.

## Tipos de conta/divida

O modulo passa a trabalhar com dois tipos:

| Tipo | Uso | Recorrencia |
| --- | --- | --- |
| `avulsa` | Pagamento pontual, boleto eventual, compra especifica ou divida sem repeticao | Sem recorrencia obrigatoria |
| `fixa` | Conta recorrente, como aluguel, internet, escola, assinatura ou financiamento | Inicialmente mensal |

## Regra inicial

- Toda conta avulsa fica com `bill_type = 'avulsa'`.
- Toda conta fixa fica com `bill_type = 'fixa'`.
- Conta fixa nasce com recorrencia `mensal` quando nenhuma recorrencia for informada.
- Recorrencia personalizada fica preparada para fase futura.

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

A tela de `Contas a pagar` passa a comunicar melhor o objetivo do modulo:

- Contas e dividas;
- Conta avulsa;
- Conta fixa;
- Total de avulsas;
- Total de fixas;
- Badges na listagem indicando o tipo.

## Fora do escopo desta fase

- Modulo separado `/protected/dividas`;
- recorrencia personalizada completa;
- geracao automatica de proximas parcelas;
- edicao completa de conta fixa/avulsa;
- filtros avancados por tipo e status.

Esses pontos podem evoluir em Issues futuras.
