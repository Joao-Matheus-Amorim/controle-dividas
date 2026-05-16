# Edicao e confirmacao de exclusao de gastos

## Objetivo

Amadurecer o modulo de Gastos com edicao completa e exclusao mais segura.

## O que foi implementado

- Action de edicao completa de gasto.
- Reaproveitamento das validacoes de criacao.
- Validacao de permissao `can_edit` sobre a pessoa atual do gasto.
- Validacao de permissao `can_edit` sobre a nova pessoa quando o responsavel muda.
- Formulario de gasto reaproveitado para criacao e edicao.
- Dialog de edicao na listagem de gastos.
- Dialog de confirmacao antes da exclusao.
- Otimizacao posterior da listagem para evitar passar dados compartilhados por linha.
- Reset do estado de confirmacao ao fechar ou submeter a exclusao.

## Campos editaveis

- Pessoa responsavel;
- categoria;
- data;
- valor;
- descricao;
- local da compra;
- forma de pagamento;
- banco/cartao;
- observacao.

## Regras de permissao

- Para editar, o usuario precisa ter `can_edit` no modulo `GASTOS` para a pessoa atual do gasto.
- Se a pessoa responsavel mudar, o usuario tambem precisa ter `can_edit` para a nova pessoa.
- Para excluir, o usuario precisa ter `can_delete` para a pessoa atual do gasto.

## Revalidacao

Depois de editar ou excluir, o app revalida:

```txt
/protected/gastos
/protected
```

## UX de exclusao

A exclusao exige confirmacao explicita antes do envio.

No componente client otimizado, o dialog compartilhado limpa:

```txt
deletingExpense
isDeleteConfirmed
```

quando fecha ou apos submeter a exclusao. Isso evita manter dados antigos ou confirmacao marcada em uma nova tentativa de exclusao.

## Fora do escopo

- Historico de alteracoes;
- restauracao de gasto excluido;
- toast global;
- filtros avancados de gastos;
- anexos/comprovantes.
