-- Adiciona payment_form (dinheiro/conta) às tabelas de contas a pagar e receber
-- para controlar obrigatoriedade do banco e gerar movimentação financeira.

alter table payable_bills
  add column if not exists payment_form text default 'dinheiro' not null;

alter table receivable_incomes
  add column if not exists payment_form text default 'dinheiro' not null;
