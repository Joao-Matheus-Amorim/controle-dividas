# SQL - Status DocDoc

> Status DocDoc: Atual
> Uso atual: indice vivo das queries operacionais de diagnostico, preflight e
> dry-run.
> Atualizado em: 2026-06-01.

## Como usar

As queries deste diretorio sao ferramentas operacionais. Elas ajudam a revisar
estado de banco antes de migrations, reparos ou validacoes manuais.

Este diretorio nao e autorizacao para executar SQL em producao. Antes de rodar
qualquer arquivo:

1. confirme o ambiente alvo;
2. leia o arquivo inteiro;
3. confirme se a query e somente diagnostico ou dry-run;
4. compare com migrations atuais em `supabase/migrations`;
5. registre evidencia fora deste diretorio quando o resultado for usado para
   tomada de decisao.

## Arquivos

| Arquivo | Status DocDoc | Uso seguro |
| --- | --- | --- |
| `banks-organization-dry-run.sql` | Ferramenta operacional | Dry-run/diagnostico de bancos antes de backfill ou hardening. |
| `banks-organization-null-preflight.sql` | Ferramenta operacional | Preflight de bancos com `organization_id` nulo. |
| `expenses-organization-backfill-dry-run.sql` | Ferramenta operacional | Dry-run/diagnostico de despesas antes de backfill ou hardening. |
| `expenses-organization-null-preflight.sql` | Ferramenta operacional | Preflight de despesas com `organization_id` nulo. |
| `feature-permissions-organization-dry-run.sql` | Ferramenta operacional | Dry-run/diagnostico de permissoes de funcionalidades antes de backfill ou hardening. |
| `feature-permissions-organization-null-preflight.sql` | Ferramenta operacional | Preflight de permissoes de funcionalidades com `organization_id` nulo. |
| `finance-relationships-orphan-preflight.sql` | Ferramenta operacional | Preflight de orfaos para relacionamentos financeiros restaurados pela migration `043`. |
| `legacy-organization-backfill-dry-run.sql` | Ferramenta operacional | Dry-run legado de mapeamento `owner_id` para organizacao. |
| `legacy-organization-null-preflight.sql` | Ferramenta operacional | Preflight legado de linhas com `organization_id` nulo. |
| `module-permissions-organization-dry-run.sql` | Ferramenta operacional | Dry-run/diagnostico de permissoes de modulo antes de backfill ou hardening. |
| `module-permissions-organization-null-preflight.sql` | Ferramenta operacional | Preflight de permissoes de modulo com `organization_id` nulo. |
| `payable-bills-organization-dry-run.sql` | Ferramenta operacional | Dry-run/diagnostico de contas a pagar antes de backfill ou hardening. |
| `payable-bills-organization-null-preflight.sql` | Ferramenta operacional | Preflight de contas a pagar com `organization_id` nulo. |
| `profile-organization-dry-run.sql` | Ferramenta operacional | Dry-run/diagnostico de perfis antes de backfill ou hardening. |
| `profile-organization-null-check.sql` | Ferramenta operacional | Checagem direta de perfis com `organization_id` nulo. |
| `receivable-incomes-organization-dry-run.sql` | Ferramenta operacional | Dry-run/diagnostico de contas a receber antes de backfill ou hardening. |
| `receivable-incomes-organization-null-preflight.sql` | Ferramenta operacional | Preflight de contas a receber com `organization_id` nulo. |

## Regra operacional

Arquivos SQL em `docs/sql` sao auxiliares. Eles nao substituem migrations,
runbooks, RLS Live Gate, CI ou evidencia de banco alvo.
