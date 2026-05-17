# Admin and Permissions Multi-Organization Audit

Issue: #189

## Objetivo

Auditar o estado atual de admin e permissoes antes de evoluir para multi-organization pleno.

Esta auditoria nao altera codigo, banco, RLS, rotas ou billing.

## Arquivos revisados

- `lib/finance/admin-server.ts`
- `lib/finance/access-control.ts`
- `app/protected/admin/page.tsx`
- `app/protected/admin/usuarios/page.tsx`
- `app/protected/admin/permissoes/page.tsx`

## Resultado executivo

Admin e permissoes ainda sao majoritariamente owner-centric.

Isso e aceitavel no modo transicional atual, mas nao e suficiente para SaaS multi-org final.

## Achados

### 1. Admin centralizado em helper legado

As paginas admin usam `getAdminDashboardData` de `lib/finance/admin-server.ts`.

Paginas impactadas:

- `/protected/admin`
- `/protected/admin/usuarios`
- `/protected/admin/permissoes`

Classificacao: aceitavel temporariamente, mas precisa hardening antes de multi-org final.

### 2. Admin ainda depende de `ADMIN_EMAIL`

O fluxo atual cria/valida admin por email configurado e `owner_id`.

Classificacao: funcional para o modelo familiar inicial, mas insuficiente para SaaS multi-org.

### 3. Profiles ainda sao filtrados por owner

`getFamilyProfiles` ainda filtra profiles por `owner_id`.

Risco:

- nao usa `organization_id`;
- nao usa membership;
- nao cobre bem usuario com multiplas organizations.

### 4. Permissoes ainda sao filtradas por owner

`getFamilyPermissions` e `getFamilyFeaturePermissions` ainda filtram por `owner_id`.

Risco:

- `organization_id` existe no schema, mas ainda nao e usado no admin;
- permissoes continuam presas ao modelo familiar/owner.

### 5. Access control ainda usa profile/owner como base

`access-control.ts` ainda usa profile, owner, admin client e membro ativo por owner.

Risco:

- nao considera organization ativa diretamente;
- admin por role pode ser interpretado de forma ampla demais no futuro multi-org.

## O que nao foi encontrado

Nao foi encontrada implementacao completa de:

- admin por organization ativa;
- selector de organization no admin;
- permissoes por organization no fluxo admin;
- testes multi-org para admin/permissoes.

## Recomendacoes

1. Planejar helper admin organization-aware.
2. Migrar leituras admin para organization ativa.
3. Separar admin familiar legado de admin SaaS.
4. Criar testes multi-org para admin/permissoes.
5. So depois alterar RLS de profiles/permissoes.

## Ordem sugerida

1. Criar testes de acesso admin multi-org.
2. Migrar leituras admin para organization-aware.
3. Migrar escrita de permissoes para organization-aware.
4. Atualizar RLS de profiles/permissoes.
5. Planejar rotas por `orgSlug` para admin.

## Fora de escopo

Esta auditoria nao implementa:

- codigo;
- migration;
- RLS;
- rotas;
- billing;
- UI;
- remocao de `owner_id`;
- `organization_id NOT NULL`.

## Conclusao

Admin e permissoes estao funcionais para o modelo familiar/transicional, mas ainda nao estao prontos para SaaS multi-org final.

O proximo passo seguro e criar testes e helpers organization-aware para admin antes de qualquer mudanca destrutiva em RLS, rotas ou schema.
