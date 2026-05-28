# FamilyFinance - Arquitetura Tecnica

Este documento descreve a arquitetura tecnica atual do FamilyFinance e mostra como browser/PWA, Next.js SSR, Server Actions, sistema de permissoes, Supabase Auth, Supabase RLS e banco PostgreSQL trabalham juntos.

Documentos de estado vivo:

- `README.md`
- `docs/SAAS_RLS_LIVE_STATUS.md`
- `docs/SAAS_OPERATIONAL_ROADMAP.md`
- `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`

## Objetivo da arquitetura

A arquitetura do FamilyFinance precisa garantir quatro coisas:

1. cada usuario autenticado acessa apenas o que foi autorizado;
2. o Admin consegue administrar somente dentro da organizacao ativa;
3. as regras de permissao existem no servidor, nao apenas na tela;
4. o banco permanece protegido por RLS e por validacoes server-side.

A regra central do produto continua sendo:

```txt
Role define o padrao inicial.
Admin define a permissao real.
Permissao sempre vence o role.
Tudo isso acontece dentro de uma organizacao.
```

## Visao em camadas

```txt
Browser / PWA
    ↓
Next.js Proxy de Sessao
    ↓
Next.js App Router
    ↓
Server Components / Client Components
    ↓
Server Actions / Server Queries
    ↓
Camada de Permissoes FamilyFinance
    ↓
Supabase Auth + Supabase Clients
    ↓
Supabase RLS por organization membership
    ↓
PostgreSQL Database
```

## Fluxo de request protegida

Exemplo: usuario acessa `/protected/gastos`.

```txt
1. Browser solicita /protected/gastos.
2. proxy.ts intercepta a request.
3. updateSession cria Supabase server client.
4. updateSession verifica claims da sessao.
5. sem sessao: redirect /auth/login.
6. com sessao: segue para App Router.
7. App Router renderiza Server Component da pagina.
8. pagina chama helpers financeiros server-side.
9. helpers chamam getCurrentProfile() e getCurrentOrganization().
10. camada de permissoes resolve modulos, acoes e escopo dentro da organizacao ativa.
11. query busca apenas linhas da organizacao ativa e membros acessiveis.
12. Supabase RLS valida membership por organization_id.
13. dados retornam para o Server Component.
14. HTML/React payload renderiza no browser.
```

## Fluxo de mutacao protegida

Exemplo: usuario cria um gasto.

```txt
1. Usuario preenche formulario no browser.
2. Client Component submete para Server Action.
3. Server Action valida dados obrigatorios.
4. Server Action chama getCurrentProfile() e resolve organizacao ativa.
5. Server Action chama assertCanAccessMember('GASTOS', 'can_create', familyMemberId).
6. assertCanAccessMember calcula membros permitidos dentro da organizacao ativa.
7. se o membro nao estiver no escopo: erro de permissao.
8. se permitido: insert em expenses com organization_id da organizacao ativa.
9. Supabase valida RLS/policies quando usando server client comum.
10. dados sao persistidos.
11. revalidatePath atualiza paginas afetadas.
12. usuario recebe feedback na UI.
```

## Responsabilidades por camada

### Browser / PWA

O browser exibe UI, envia formularios e navega entre paginas. Ele nao deve acessar `SUPABASE_SERVICE_ROLE_KEY`, decidir permissao sensivel sozinho ou buscar dados financeiros sensiveis sem passar pelo servidor.

### Next.js Proxy

Arquivos:

```txt
proxy.ts
lib/supabase/proxy.ts
```

Responsabilidades:

- interceptar requests;
- ignorar assets e rotas publicas;
- criar Supabase server client por request;
- sincronizar cookies;
- chamar `supabase.auth.getClaims()`;
- redirecionar usuario sem sessao para `/auth/login`.

### App Router

Rotas publicas/autenticacao:

```txt
/
/auth/login
/auth/sign-up
/auth/sign-up-success
/auth/forgot-password
/auth/update-password
/auth/error
/auth/confirm
/onboarding/organizacao
```

Rotas protegidas atuais:

```txt
/protected
/protected/pessoas
/protected/gastos
/protected/contas-a-pagar
/protected/contas-a-receber
/protected/bancos
/protected/relatorios
/protected/configuracoes
/protected/admin
/protected/admin/usuarios
/protected/admin/permissoes
```

As rotas organization-aware existem com o contrato aceito no ADR 0007:

```txt
/org/[orgSlug]
```

`/protected` permanece como rota compativel durante a transicao.

### Server Components e Server Actions

Server Components carregam dados no servidor, chamam helpers de permissao e montam a visao conforme profile/organizacao ativa.

Server Actions validam input, profile, permissao, organizacao ativa, executam mutacoes e revalidam paginas afetadas.

## Organizacao ativa

Arquivos principais:

```txt
lib/organizations/server.ts
app/protected/layout.tsx
app/org/[orgSlug]/layout.tsx
components/app/app-shell.tsx
app/protected/organization-switcher-actions.ts
components/app/active-organization-indicator.tsx
```

Contrato atual:

- a organizacao ativa vem das memberships ativas do usuario;
- `getCurrentOrganization()` resolve o contexto atual;
- `getUserOrganizations()` lista opcoes disponiveis;
- o indicador mostra a organizacao ativa;
- quando houver mais de uma organizacao, a action `setActiveOrganization()` permite troca explicita.

## Camada de permissoes

Arquivos principais:

```txt
lib/finance/access-control.ts
lib/finance/permissions.ts
lib/finance/admin-server.ts
lib/finance/profile-linking.ts
```

Funcoes principais:

```txt
getCurrentProfile()
getModulePermission(profileId, module)
getFeaturePermission(profileId, featureKey)
canUseFeature(featureKey)
canViewModule(module)
getVisibleModuleKeys(modules)
getAccessibleMemberIds(module, action)
assertCanAccessMember(module, action, targetMemberId)
```

## Supabase Clients

### Browser client

Arquivo:

```txt
lib/supabase/client.ts
```

Uso: browser e operacoes publicas de auth quando aplicavel. Sem service role.

### Server client

Arquivo:

```txt
lib/supabase/server.ts
```

Uso: Server Components e Server Actions associados a sessao. Respeita cookies e RLS.

### Admin client

Arquivo:

```txt
lib/supabase/admin.ts
```

Uso: apenas server-side para operacoes administrativas, Auth Admin API e casos onde service role e necessario.

Regra critica:

```txt
createAdminClient() nunca deve ser importado em Client Component.
SUPABASE_SERVICE_ROLE_KEY nunca deve aparecer no browser.
```

## RLS e permissoes do app

O FamilyFinance usa duas camadas de seguranca:

```txt
1. RLS do Supabase
2. Permissoes da aplicacao
```

### RLS

RLS protege o banco por membership em `organization_id`.

Modelo atual das tabelas financeiras/permissoes:

```txt
select: public.is_organization_member(organization_id)
insert/update/delete: owner_id = auth.uid() AND public.is_organization_member(organization_id)
```

Modelo atual de `profiles`:

```txt
select: auth_user_id = auth.uid() OR public.is_organization_member(organization_id)
insert/update/delete: owner_id = auth.uid() AND public.is_organization_member(organization_id)
```

`owner_id` ainda existe como compatibilidade e write ownership. Ele nao deve ser tratado como isolamento SaaS final.

### Permissoes da aplicacao

As permissoes da aplicacao definem a regra fina:

- qual modulo aparece;
- qual acao pode executar;
- quais membros financeiros pode acessar;
- se pode ver proprio, selecionados ou familia inteira;
- funcionalidades especificas liberadas.

As duas camadas devem trabalhar juntas. Nunca confiar apenas no frontend.

## Banco de dados

Tabelas financeiras:

```txt
family_members
expense_categories
expenses
payable_bills
receivable_incomes
banks
```

Tabelas de acesso:

```txt
profiles
user_module_permissions
user_feature_permissions
```

Tabelas SaaS:

```txt
organizations
organization_memberships
```

## Testes e qualidade

Gates principais:

```bash
npm audit --audit-level=moderate
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

RLS real e E2E autenticado/data-changing sao gated por variaveis explicitas.

Workflow manual de RLS real:

```txt
.github/workflows/rls-live-gate.yml
```

## Pontos de atencao

1. A limpeza manual das policies antigas `*_own`/`*_family` ja foi versionada na migration idempotente `039_drop_legacy_owner_family_policies.sql`.
2. Ambientes que nao receberam a limpeza manual precisam aplicar a migration `039`.
3. `owner_id` ainda nao deve ser removido.
4. Rotas `[orgSlug]` existem e `/protected` segue compativel.
5. Billing ainda nao existe.
6. Client Components nao podem importar Admin Client.
7. Data-changing E2E precisa de cleanup.

## Checklist para nova funcionalidade

```txt
1. Qual modulo controla essa tela?
2. A tela exige can_view?
3. O botao exige can_create, can_edit ou can_delete?
4. A action valida permissao no servidor?
5. A query filtra pela organizacao ativa?
6. A query filtra por getAccessibleMemberIds quando envolve membro financeiro?
7. O Admin deve ter bypass dentro da organizacao?
8. Usuario inativo fica bloqueado?
9. A rota precisa aparecer no menu?
10. Precisa de teste unitario, integracao ou E2E gated?
11. Precisa atualizar README/status/roadmap?
```

## Roadmap arquitetural

Curto prazo:

- configurar e rodar RLS Live Gate em CI dedicado;
- confirmar E2E gated de troca de organizacao ativa quando houver ambiente dedicado;
- ampliar cobertura E2E dedicada para `/org/[orgSlug]`.

Medio prazo:

- evoluir rotas por `orgSlug` seguindo ADR 0007 (`/org/[orgSlug]`) sem remover `/protected` antes de decisao propria;
- evoluir filtros/relatorios e periodo dinamico;
- ampliar cobertura E2E de perfis e modulos.

Longo prazo:

- billing por organization;
- remocao planejada de `owner_id`;
- app mobile/React Native quando web/PWA estiver madura.
