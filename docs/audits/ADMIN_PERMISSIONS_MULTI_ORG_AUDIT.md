# Admin and Permissions Multi-Organization Audit

Issue: #189

Follow-up: #480

## Objetivo

Auditar e reconciliar o estado atual de admin e permissoes antes de evoluir para multi-organization pleno.

Esta auditoria nao altera codigo, banco, RLS, rotas ou billing.

## Arquivos revisados

- `lib/finance/admin-server.ts`
- `lib/finance/access-control.ts`
- `app/protected/admin/actions.ts`
- `app/protected/admin/page.tsx`
- `app/protected/admin/usuarios/page.tsx`
- `app/protected/admin/permissoes/page.tsx`
- `__tests__/unit/admin-permissions-guards.test.ts`

## Resultado executivo

Admin e permissoes nao devem mais ser descritos como puramente owner-centric.

O estado atual da `main` e transicional e active-organization scoped:

- leituras admin usam `requireOrganizationAccess()`;
- leituras de profiles, membros, module permissions e feature permissions filtram por `owner_id` mais organization ativa ou legado;
- escritas admin gravam `organization_id` nos principais fluxos;
- escritas validam que membros/perfis pertencem a organization ativa ou legado antes de alterar dados;
- guardas unitarios impedem regressao para admin/permissoes sem escopo de organization ativa.

Isso melhora a seguranca multi-org transicional, mas ainda nao significa SaaS multi-org final.

## Estado historico anterior

A auditoria original identificou Admin e permissoes como majoritariamente owner-centric.

Esse diagnostico foi correto para o momento da auditoria, mas ficou desatualizado apos hardening posterior de Admin/permissoes.

O risco atual nao e mais "Admin puramente owner-centric". O risco atual e manter o modelo transicional seguro enquanto ainda existem:

- `ADMIN_EMAIL` como bootstrap administrativo;
- dependencia de `owner_id` para compatibilidade;
- fallback legado `organization_id IS NULL`;
- ausencia de selector multi-org completo;
- ausencia de rotas por `orgSlug`;
- RLS final e schema final ainda pendentes.

## Achados atuais

### 1. Admin centralizado em helper unico

As paginas admin continuam usando `getAdminDashboardData` de `lib/finance/admin-server.ts`.

Paginas impactadas:

- `/protected/admin`
- `/protected/admin/usuarios`
- `/protected/admin/permissoes`

Classificacao atual: desejavel para evitar logica duplicada nas paginas. O helper central agora chama `requireOrganizationAccess()` e repassa `organization.id` para as leituras admin.

### 2. Admin ainda depende de `ADMIN_EMAIL` para bootstrap

O fluxo de bootstrap administrativo ainda depende de email configurado.

Classificacao atual: aceitavel apenas como mecanismo transicional de bootstrap. Nao substitui um modelo SaaS final com owner/admin por organization, convites, billing e governanca de conta.

### 3. Profiles agora sao filtrados por owner mais organization ativa ou legado

`getFamilyProfiles` usa:

```txt
owner_id = adminProfile.owner_id
AND (organization_id = active organization OR organization_id IS NULL)
```

Classificacao atual: escopo transicional correto para a fase atual.

Risco restante:

- ainda depende de `owner_id`;
- ainda aceita legado `organization_id IS NULL`;
- ainda nao representa o modelo final baseado apenas em membership/organization.

### 4. Permissoes agora sao filtradas por owner mais organization ativa ou legado

`getFamilyPermissions` e `getFamilyFeaturePermissions` usam o mesmo padrao transicional:

```txt
owner_id = adminProfile.owner_id
AND (organization_id = active organization OR organization_id IS NULL)
```

Classificacao atual: escopo transicional correto para a fase atual.

Risco restante:

- permissions ainda nao devem ser consideradas SaaS final;
- RLS final e UX multi-org ainda precisam ser planejadas antes de remover fallback legado.

### 5. Escritas admin gravam e validam organization ativa

`app/protected/admin/actions.ts` usa `requireOrganizationAccess()` nos fluxos de escrita e grava `organization_id: organization.id` em:

- criacao de profile;
- criacao de module permissions;
- update de profile legado;
- sync de `auth_user_id`;
- toggle de status;
- upsert de permissoes.

Tambem valida escopo antes de alterar dados com helpers como:

- `ensureMemberBelongsToOrganization`;
- `ensureProfileBelongsToOrganization`;
- `ensureUniqueEmail` com organization;
- `ensureUniqueMemberAccess` com organization.

Classificacao atual: hardening transicional implementado na application layer.

### 6. Access control considera organization ativa

`access-control.ts` ja integra `requireOrganizationAccess()` e filtros de organization ativa ou legado.

Classificacao atual: melhor que o estado owner-centric historico, mas ainda transicional.

## Guardas existentes

`__tests__/unit/admin-permissions-guards.test.ts` protege o estado atual ao exigir:

- centralizacao das paginas admin em `getAdminDashboardData`;
- uso de `requireOrganizationAccess`;
- filtro `organization_id.eq.${organizationId}`;
- fallback `organization_id.is.null`;
- leituras admin filtradas por owner mais organization/legado;
- escritas admin amarradas a organization ativa;
- access control documentado como active-organization scoped.

## O que ainda nao existe

Ainda nao existe implementacao completa de:

- selector UX para usuario com multiplas organizations;
- rotas admin por `orgSlug`;
- remocao do fallback legado;
- remocao de `owner_id`;
- `organization_id NOT NULL`;
- billing e limites por plano;
- RLS final sem dependencia transicional de owner/legado.

## Recomendacoes atualizadas

1. Manter guardas unitarios de Admin/permissoes active-organization scoped.
2. Nao aplicar RLS final em profiles/permissoes antes de decidir UX multi-org e legado.
3. Planejar selector de organization ativa antes de rotas por `orgSlug`.
4. Planejar remocao gradual de fallback legado apenas depois de backfill completo e testes.
5. Tratar `ADMIN_EMAIL` como bootstrap transicional, nao como modelo SaaS final.

## Ordem sugerida

1. Reconciliar documentacao desatualizada de Admin/permissoes.
2. Planejar UX de multiplas organizations e organization ativa.
3. Criar testes especificos para troca/seleção de organization quando a UX existir.
4. Planejar rotas por `orgSlug` para Admin e modulos protegidos.
5. So depois endurecer RLS final de profiles/permissoes e remover fallback legado.

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

Admin e permissoes foram endurecidos para o modelo transicional com organization ativa.

Eles ainda nao representam o SaaS multi-org final, mas a documentacao deve refletir que o risco mudou: de owner-centric puro para transicional active-organization scoped com fallback legado controlado.
