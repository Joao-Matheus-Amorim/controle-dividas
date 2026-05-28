# Finance form UI contract

Atualizado em: 2026-05-28

## Objetivo

Este contrato fecha o terceiro passo do GAP-011: proteger os formularios data-changing primarios sem criar snapshot amplo ou redesenho visual.

Escopo coberto neste PR:

- gastos em `components/finance/expense-form.tsx` e `components/finance/expense-form-dialog.tsx`;
- contas a pagar em `components/finance/payable-bill-form.tsx` e `components/finance/payable-bill-form-dialog.tsx`;
- contas a receber em `components/finance/receivable-income-form.tsx` e `components/finance/receivable-income-form-dialog.tsx`;
- bancos em `components/finance/bank-account-form.tsx` e `components/finance/bank-account-form-dialog.tsx`;
- pessoas em `components/finance/family-member-form.tsx` e `components/finance/family-member-form-dialog.tsx`.

## Contrato funcional de UI

Os formularios financeiros primarios devem manter:

- `useActionState` para server actions;
- `AppActionFeedback` para erro/sucesso retornado pela action;
- `Button` de submit desabilitado enquanto `isPending`;
- labels vinculados por `htmlFor`/`id`;
- campos obrigatorios onde o dominio exige dado minimo;
- grid responsivo mobile-first;
- modo de edicao quando o mesmo form cobre create/edit;
- input hidden `id` nos modos de edicao;
- textos de submit diferentes para salvando, criando e editando.

## Contrato de dialog/sheet

Os formularios de criacao devem continuar abrindo por `AppFormSheet`:

- `ExpenseFormDialog`;
- `PayableBillFormDialog`;
- `ReceivableIncomeFormDialog`;
- `BankAccountFormDialog`;
- `FamilyMemberFormDialog`.

Esse contrato preserva a experiencia mobile-first e evita conversoes visuais isoladas de Sheet para Dialog sem decisao de UX.

## Contrato por dominio

Gastos devem manter:

- pessoa responsavel;
- categoria;
- data;
- valor;
- descricao;
- local, forma de pagamento, banco/cartao e observacao opcionais.

Contas a pagar devem manter:

- alternancia entre conta avulsa e conta fixa;
- nome, categoria, valor e vencimento;
- responsavel, status, banco, recorrencia e observacao;
- recorrencia desabilitada para conta avulsa.

Contas a receber devem manter:

- pessoa que vai receber;
- origem do dinheiro;
- tipo de renda;
- valor;
- data prevista;
- status;
- banco de recebimento e observacao.

Bancos devem manter:

- pessoa vinculada;
- nome do banco;
- tipo de conta;
- saldo atual;
- moeda;
- observacao.

Pessoas devem manter:

- nome;
- perfil;
- limite mensal.

## Fora de escopo

Este contrato nao:

- adiciona snapshot visual amplo;
- altera server actions;
- altera validacao de negocio;
- altera schema, RLS, billing ou rotas;
- redesenha formularios;
- remove `owner_id`.

## Proxima expansao segura

Depois deste contrato, GAP-011 deve avancar apenas quando houver decisao explicita para:

1. estados de erro/vazio mais ricos;
2. snapshot visual seletivo;
3. redesign visual amplo;
4. graficos do dashboard quando GAP-018 for implementado.
