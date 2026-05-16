# Otimizacao da lista de gastos

## Objetivo

Reduzir serializacao e hidratacao repetida na tela `/protected/gastos`.

## Problema identificado

A implementacao anterior renderizava um componente client de acoes dentro de cada item do `expenses.map(...)`, passando `expense`, `members` e `categories` para cada linha.

Isso funcionava, mas podia aumentar o payload client porque `members` e `categories` eram enviados repetidamente para cada gasto.

## Solucao

Foi criado um componente client unico para a listagem:

```txt
components/finance/expense-list-client.tsx
```

Agora a pagina server passa:

```txt
expenses
members
categories
canEdit
canDelete
```

uma unica vez para o componente client.

Dentro do componente client, os dialogs sao controlados por estado:

```txt
editingExpense
deletingExpense
isDeleteConfirmed
```

## Beneficios

- Reduz duplicacao de dados enviados para o client.
- Evita instanciar dialogs completos dentro de cada linha.
- Mantem edicao e exclusao funcionando.
- Mantem confirmacao antes de exclusao.
- Mantem a pagina server mais limpa.

## Fora do escopo

- Virtualizacao da lista;
- paginacao server-side;
- busca/filtro de gastos;
- toast global;
- historico de alteracoes.
