-- Add optional payment origin detail to receivable incomes.
-- Stores who/where the expected payment comes from without changing the accounting source/category.

alter table public.receivable_incomes
  add column if not exists payment_origin text;
