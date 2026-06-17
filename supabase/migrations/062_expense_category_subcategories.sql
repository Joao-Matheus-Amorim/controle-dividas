-- Add optional subcategories for expense category organization trees.

alter table public.expense_categories
  add column if not exists parent_category_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expense_categories_parent_category_id_fkey'
      and conrelid = 'public.expense_categories'::regclass
  ) then
    alter table public.expense_categories
      add constraint expense_categories_parent_category_id_fkey
      foreign key (parent_category_id)
      references public.expense_categories(id)
      on delete set null
      not valid;
  end if;
end $$;

alter table public.expense_categories
  validate constraint expense_categories_parent_category_id_fkey;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expense_categories_parent_not_self_check'
      and conrelid = 'public.expense_categories'::regclass
  ) then
    alter table public.expense_categories
      add constraint expense_categories_parent_not_self_check
      check (parent_category_id is null or parent_category_id <> id)
      not valid;
  end if;
end $$;

alter table public.expense_categories
  validate constraint expense_categories_parent_not_self_check;

create index if not exists expense_categories_parent_category_id_idx
  on public.expense_categories(parent_category_id);

create index if not exists expense_categories_organization_parent_name_idx
  on public.expense_categories(organization_id, parent_category_id, lower(trim(name)));

create or replace function public.expense_category_parent_matches_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_category_id is null then
    return new;
  end if;

  if new.parent_category_id = new.id then
    raise exception 'Categoria nao pode ser subcategoria dela mesma.';
  end if;

  if not exists (
    select 1
    from public.expense_categories parent_category
    where parent_category.id = new.parent_category_id
      and parent_category.organization_id = new.organization_id
      and parent_category.parent_category_id is null
  ) then
    raise exception 'Categoria pai nao pertence a esta organizacao.';
  end if;

  if exists (
    select 1
    from public.expense_categories child_category
    where child_category.parent_category_id = new.id
      and child_category.organization_id = new.organization_id
  ) then
    raise exception 'Categoria com subcategorias nao pode virar subcategoria.';
  end if;

  return new;
end;
$$;

drop trigger if exists expense_categories_parent_matches_organization_trg
  on public.expense_categories;

create trigger expense_categories_parent_matches_organization_trg
  before insert or update of parent_category_id, organization_id
  on public.expense_categories
  for each row
  execute function public.expense_category_parent_matches_organization();
