# Finance list UI contract

> Status DocDoc: Atual
> Uso atual: contrato textual vigente das listas financeiras primarias.
> Observacao: complementa guards e permissoes; nao substitui server actions,
> RLS ou validacao de dados.

Atualizado em: 2026-05-28

## Objetivo

Este contrato fecha o segundo passo do GAP-011: proteger as listas financeiras primarias sem criar snapshot amplo ou redesenho visual.

Escopo coberto neste PR:

- gastos em `components/expenses/expense-list-section.tsx` e `components/finance/expense-list-client.tsx`;
- contas a pagar em `components/payables/payable-list.tsx` e `components/payables/payable-list-item.tsx`;
- contas a receber em `components/receivables/receivable-list.tsx` e `components/receivables/receivable-list-item.tsx`;
- bancos em `components/banks/bank-list.tsx` e `components/banks/bank-list-item.tsx`;
- pessoas em `components/people/people-list.tsx` e `components/people/people-list-item.tsx`.

## Contrato funcional de UI

As listas financeiras devem manter:

- titulo compacto da lista;
- contador ou resumo de itens visiveis;
- estado vazio quando a lista principal nao possui dados;
- item component separado para leitura do registro;
- texto truncado para evitar overflow em nomes, categorias, bancos, pessoas e observacoes;
- valores financeiros formatados por helper existente;
- badges de status/tipo quando o dominio ja usa esse padrao.

## Contrato de filtros

Contas a pagar deve preservar:

- `PayableFilterBar`;
- contagem `filteredBills.length` de `bills.length`;
- estado vazio para filtro sem resultado;
- link de limpar filtros apenas quando ha filtros ativos.

As demais listas ainda nao possuem filtro local dedicado neste contrato.

## Contrato de permissoes e acoes

Acoes de escrita devem continuar condicionadas por permissao:

- gastos usam `canEdit` e `canDelete`;
- contas a pagar usam `canEdit` e `canDelete`;
- contas a receber usam `canEdit` e `canDelete`;
- bancos usam `canEdit` e `canDelete`;
- pessoas mantem status e edicao dentro do contrato atual de pessoas.

Este contrato nao substitui RLS, server actions ou guards de permissao. Ele protege a superficie de UI contra regressao estrutural.

## Contrato visual

Este contrato nao muda a UI. Ele registra a baseline atual:

- secoes com `rounded-[1.5rem]`, `border-white/10` e fundo escuro translucido;
- itens com `rounded-2xl`, `bg-[#080810]/50` e layout mobile-first;
- acoes por `Button`, Dialog, Sheet ou forms especificos de dominio;
- componentes de dominio permanecem em suas pastas atuais.

## Fora de escopo

Este contrato nao:

- adiciona snapshot visual amplo;
- adiciona dependencias;
- redesenha listas;
- altera formularios;
- altera server actions;
- altera schema, RLS, billing ou rotas;
- remove `owner_id`.

## Proxima expansao segura

Depois deste contrato, a cobertura de UI deve avancar para formularios data-changing:

1. gastos;
2. contas a pagar;
3. contas a receber;
4. bancos;
5. pessoas e acessos.

Status: formularios financeiros primarios agora possuem contrato proprio em `docs/audits/FINANCE_FORM_UI_CONTRACT.md`.
