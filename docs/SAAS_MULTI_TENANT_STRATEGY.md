# FamilyFinance SaaS Multi-tenant - Estrategia Tecnica e de Produto

> Status DocDoc: Historico/estrategia
> Superado por: ADRs atuais, `docs/VALIDACAO_TECNICA.md`,
> `docs/SAAS_GAP_REGISTER.md` e `docs/DOCUMENTATION_STATUS.md`.
> Uso atual: contexto estrategico da virada multi-tenant; nao usar como
> evidencia de implementacao, migrations ou RLS atuais.

## 1. Contexto da mudanca

O FamilyFinance foi inicialmente documentado e implementado como uma solucao financeira familiar personalizada para uma unica familia. A arquitetura atual ja possui varios elementos maduros: autenticacao com Supabase Auth, dashboard financeiro, membros familiares, gastos, contas a pagar, contas a receber, bancos, relatorios, configuracoes, painel Admin, permissoes por modulo, permissoes por acao, escopo de dados e testes automatizados.

Mesmo tendo nascido como produto familiar privado, o projeto ja apresenta caracteristicas que podem gerar valor como SaaS:

- controle financeiro familiar;
- painel administrativo;
- permissoes por usuario;
- modulos financeiros reais;
- PWA/mobile-first;
- arquitetura Next.js + Supabase;
- base de testes;
- documentacao PMBOK;
- fluxo profissional de Pull Requests e CI.

A decisao estrategica passa a ser avaliar e preparar a evolucao do FamilyFinance para um SaaS multi-tenant funcional, seguro e comercialmente valioso.

Esta evolucao nao deve ser confundida com uma simples troca de nomenclatura ou com uma migration isolada. Multi-tenancy altera o centro da arquitetura: os dados deixam de pertencer diretamente a um unico usuario dono e passam a pertencer a uma organizacao, familia, workspace ou conta contratante. Usuarios entram nessa organizacao por meio de memberships.

## 2. Diagnostico do estado atual

### 2.1 Modelo atual

Hoje o projeto esta mais proximo de:

```txt
auth.users
  -> owner_id
    -> family_members
    -> expense_categories
    -> expenses
    -> payable_bills
    -> receivable_incomes
    -> banks
    -> profiles
    -> user_module_permissions
    -> user_feature_permissions
```

As tabelas financeiras principais possuem `owner_id` ligado diretamente a `auth.users(id)`. As policies RLS iniciais usam a regra `auth.uid() = owner_id`.

Esse modelo e coerente para uma unica familia com um Admin dono. Ele tambem permite varios usuarios familiares por meio de `profiles`, mas continua sendo single-tenant no banco, pois o isolamento real acontece pelo usuario owner, nao por uma entidade de tenant.

### 2.2 Diagnostico arquitetural

O estado atual pode ser descrito como:

```txt
single-tenant com multi-user familiar
```

Nao e um erro. Foi uma escolha coerente para o MVP familiar privado. O problema e que ela nao escala bem para SaaS porque:

- nao existe entidade formal de tenant/organizacao;
- `owner_id` mistura dono tecnico com dono de negocio;
- um usuario nao consegue participar naturalmente de varias familias/organizacoes;
- permissoes estao presas ao owner atual;
- RLS isola por usuario, nao por membership em organizacao;
- `ADMIN_EMAIL` funciona para familia privada, mas nao para SaaS;
- futuras assinaturas/plans/billing nao tem ancora propria;
- rotas atuais `/protected/...` nao expressam contexto de organizacao.

## 3. Decisao estrategica

A nova fase proposta e transformar o FamilyFinance em um SaaS multi-tenant de gestao financeira familiar.

A implementacao deve ser incremental, nao destrutiva e validada por etapas. O MVP atual deve continuar funcionando durante a transicao sempre que possivel.

A decisao de produto passa a ser:

```txt
FamilyFinance sera evoluido para uma plataforma SaaS multi-tenant em que cada organizacao representa uma familia, grupo financeiro ou conta contratante isolada.
```

## 4. Principios da nova arquitetura

### 4.1 Nao reescrever a stack

A stack atual deve ser preservada:

```txt
Next.js
React
TypeScript
Tailwind CSS
Radix/shadcn primitives
Supabase Auth
Supabase Database/PostgreSQL
Supabase RLS
Vitest
Testing Library
MSW
PWA
```

Nao ha justificativa tecnica para trocar a stack neste momento. A direcao correta e adicionar camadas SaaS sobre a base existente.

### 4.2 Multi-tenant antes de billing

Antes de Stripe, planos pagos, trial comercial ou landing page publica, o sistema precisa garantir:

- isolamento de dados por organizacao;
- memberships corretos;
- RLS por organizacao;
- permissoes por organizacao;
- resolucao segura da organizacao ativa;
- queries e actions filtradas por organizacao;
- testes de isolamento.

Billing sem isolamento seguro nao gera SaaS confiavel.

### 4.3 Funcionalidade antes de visual

O redesign visual completo deve ficar depois da base multi-tenant.

A ordem correta e:

```txt
arquitetura de dados -> seguranca -> funcionalidade -> rotas -> experiencia -> visual -> billing
```

### 4.4 Evolucao incremental

Cada mudanca deve ser pequena, revisavel e reversivel quando possivel.

Exemplos de cortes corretos:

- uma PR para documentacao;
- uma PR para criar tabelas base;
- uma PR para popular tenant inicial;
- uma PR para adicionar `organization_id` nullable;
- uma PR para adaptar helpers server-side;
- uma PR para adaptar uma tela;
- uma PR para endurecer RLS.

Evitar PRs gigantes que misturam migration, UI, rotas, permissao e billing.

## 5. Nomenclatura oficial recomendada

### 5.1 Entidade principal

A entidade principal recomendada e:

```txt
organizations
```

Motivo:

- e mais comercial que `tenants`;
- e mais flexivel que `families`;
- serve para familia, casal, grupo, workspace ou conta contratante;
- combina melhor com billing futuro;
- evita que o banco fique restrito a uma interpretacao domestica.

`tenant` continua sendo o conceito tecnico, mas a tabela e o dominio do produto devem usar `organization`.

### 5.2 Campos padronizados

Usar nomes consistentes:

```txt
organization_id
organization_slug
auth_user_id
profile_id
family_member_id
```

Evitar misturar:

```txt
org_id
tenant_id
family_id
owner_id
```

`owner_id` pode permanecer temporariamente por compatibilidade durante a migracao, mas nao deve ser o eixo final do SaaS.

## 6. Modelo-alvo conceitual

```txt
auth.users
  -> organization_memberships
    -> organizations
      -> profiles
      -> family_members
      -> expense_categories
      -> expenses
      -> payable_bills
      -> receivable_incomes
      -> banks
      -> user_module_permissions
      -> user_feature_permissions
```

## 7. Modelo de dados proposto

### 7.1 organizations

Representa a conta SaaS, familia, workspace ou grupo financeiro.

Campos propostos:

```txt
id uuid primary key
slug text unique not null
name text not null
owner_auth_user_id uuid references auth.users(id)
plan text default 'free'
status text default 'active'
trial_ends_at timestamptz null
stripe_customer_id text null
created_at timestamptz
updated_at timestamptz
```

Observacoes:

- `slug` sera usado em rotas futuras como `/[orgSlug]/dashboard`.
- `owner_auth_user_id` representa o criador/dono inicial da organizacao.
- `plan`, `trial_ends_at` e `stripe_customer_id` podem ser preparados, mas billing real deve ficar para fase posterior.
- `status` pode permitir `active`, `trialing`, `past_due`, `suspended`, `cancelled` no futuro.

### 7.2 organization_memberships

Representa a associacao entre usuarios autenticados e organizacoes.

Campos propostos:

```txt
id uuid primary key
organization_id uuid references organizations(id) on delete cascade
auth_user_id uuid references auth.users(id) on delete cascade
role text not null default 'member'
is_active boolean default true
created_at timestamptz
updated_at timestamptz
unique(organization_id, auth_user_id)
```

Roles candidatos:

```txt
owner
admin
adult
child
custom
member
```

A role da membership define o papel do usuario dentro daquela organizacao. Um mesmo usuario pode ser `admin` em uma organizacao e `member` em outra.

### 7.3 profiles

O perfil deixa de ser apenas um usuario familiar sob `owner_id` e passa a ser perfil dentro de uma organizacao.

Campos-alvo:

```txt
id uuid primary key
organization_id uuid references organizations(id)
auth_user_id uuid references auth.users(id)
linked_family_member_id uuid references family_members(id)
name text not null
email text
role text not null
is_active boolean
created_at timestamptz
updated_at timestamptz
```

Observacao importante:

- `profiles.auth_user_id` nao deve ser globalmente unique no modelo SaaS se um usuario puder ter perfil em mais de uma organizacao.
- O correto pode ser `unique(organization_id, auth_user_id)`.

### 7.4 family_members

Representa a pessoa financeira dentro da organizacao. Nem todo `family_member` precisa ter login.

Campos-alvo:

```txt
id uuid primary key
organization_id uuid references organizations(id)
name text not null
role text
monthly_limit numeric
currency text
is_active boolean
created_at timestamptz
updated_at timestamptz
```

### 7.5 expense_categories

Categorias devem ser isoladas por organizacao.

Campos-alvo:

```txt
id uuid primary key
organization_id uuid references organizations(id)
name text not null
description text
is_default boolean
created_at timestamptz
updated_at timestamptz
unique(organization_id, name)
```

### 7.6 expenses

Gastos devem pertencer a uma organizacao e referenciar membros/categorias da mesma organizacao.

Campos-alvo:

```txt
id uuid primary key
organization_id uuid references organizations(id)
family_member_id uuid references family_members(id)
category_id uuid references expense_categories(id)
expense_date date
description text
purchase_location text
amount numeric
payment_method text
bank_or_card text
notes text
created_at timestamptz
updated_at timestamptz
```

### 7.7 payable_bills

Contas a pagar/dividas devem pertencer a uma organizacao.

Campos-alvo:

```txt
id uuid primary key
organization_id uuid references organizations(id)
name text
category text
amount numeric
due_date date
responsible_member_id uuid references family_members(id)
status text
bank_used text
recurrence text
bill_type text
notes text
created_at timestamptz
updated_at timestamptz
```

### 7.8 receivable_incomes

Recebimentos/rendas devem pertencer a uma organizacao.

Campos-alvo:

```txt
id uuid primary key
organization_id uuid references organizations(id)
receiver_member_id uuid references family_members(id)
source text
income_type text
amount numeric
expected_date date
status text
receiving_bank text
notes text
created_at timestamptz
updated_at timestamptz
```

### 7.9 banks

Bancos/saldos devem pertencer a uma organizacao.

Campos-alvo:

```txt
id uuid primary key
organization_id uuid references organizations(id)
family_member_id uuid references family_members(id)
bank_name text
account_type text
current_balance numeric
currency text
notes text
created_at timestamptz
updated_at timestamptz
```

### 7.10 user_module_permissions

Permissoes por modulo devem ser por organizacao.

Campos-alvo:

```txt
id uuid primary key
organization_id uuid references organizations(id)
profile_id uuid references profiles(id)
module text
can_view boolean
can_create boolean
can_edit boolean
can_delete boolean
scope text
allowed_member_ids uuid[]
granted_by uuid references profiles(id)
created_at timestamptz
updated_at timestamptz
unique(organization_id, profile_id, module)
```

### 7.11 user_feature_permissions

Permissoes por funcionalidade tambem devem ser por organizacao.

Campos-alvo:

```txt
id uuid primary key
organization_id uuid references organizations(id)
profile_id uuid references profiles(id)
feature_key text
is_enabled boolean
granted_by uuid references profiles(id)
created_at timestamptz
updated_at timestamptz
unique(organization_id, profile_id, feature_key)
```

## 8. RLS multi-tenant

### 8.1 Regra atual

Hoje a regra geral e baseada em:

```sql
auth.uid() = owner_id
```

### 8.2 Regra-alvo

A regra-alvo deve ser baseada em membership:

```sql
exists (
  select 1
  from public.organization_memberships m
  where m.organization_id = <table>.organization_id
    and m.auth_user_id = auth.uid()
    and m.is_active = true
)
```

Essa regra garante que um usuario so acesse dados de organizacoes das quais participa.

### 8.3 Diferenca entre RLS e permissao de negocio

RLS deve responder:

```txt
O usuario pertence a esta organizacao?
```

A aplicacao deve responder:

```txt
Dentro desta organizacao, o usuario pode ver/criar/editar/excluir este modulo, esta pessoa ou este escopo?
```

Portanto:

- RLS isola tenant;
- helpers server-side aplicam permissao fina;
- frontend apenas melhora UX escondendo o que nao pode ser usado.

## 9. Rotas SaaS

### 9.1 Estado atual

Hoje as rotas protegidas estao em:

```txt
/protected
/protected/gastos
/protected/contas-a-pagar
/protected/contas-a-receber
/protected/bancos
/protected/relatorios
/protected/configuracoes
/protected/admin
```

### 9.2 Estado futuro recomendado

```txt
app/
  (marketing)/
    page.tsx
    pricing/page.tsx

  (auth)/
    login/
    sign-up/
    forgot-password/
    update-password/

  (app)/
    [orgSlug]/
      dashboard/
      gastos/
      contas-a-pagar/
      contas-a-receber/
      bancos/
      relatorios/
      configuracoes/
      admin/
```

Exemplo de URL:

```txt
app.familyfinance.com.br/amorim/dashboard
```

ou, dependendo do dominio escolhido:

```txt
familyfinance.com.br/amorim/dashboard
```

### 9.3 Ordem correta

Nao mudar rotas antes do modelo de dados.

Ordem recomendada:

```txt
1. criar organizations e memberships
2. adicionar organization_id nas tabelas
3. adaptar helpers server-side
4. adaptar queries/actions
5. validar RLS
6. introduzir orgSlug nas rotas
```

## 10. Active organization

O app precisara resolver a organizacao ativa em cada request.

Possiveis fontes:

- `orgSlug` na URL;
- cookie de organizacao ativa;
- primeira organizacao do usuario;
- selecao manual em um switcher.

Helper sugerido:

```txt
getCurrentOrganization()
getCurrentMembership()
getCurrentProfileForOrganization()
requireOrganizationAccess()
requireOrganizationAdmin()
```

## 11. Permissoes no modelo SaaS

A regra atual continua valida, mas precisa ganhar contexto de organizacao:

```txt
Role define o padrao inicial.
Admin define a permissao real.
Permissao sempre vence o role.
Tudo isso acontece dentro de uma organizacao.
```

Exemplo:

```txt
Usuario A pode ser admin na organizacao Amorim.
Usuario A pode ser member na organizacao Silva.
Usuario A pode ter permissoes diferentes em cada organizacao.
```

## 12. Admin SaaS vs Admin da Organizacao

O SaaS precisa diferenciar:

### Platform admin

Dono ou operador da plataforma SaaS.

Pode:

- ver metricas globais;
- gerenciar suporte;
- investigar problemas;
- gerenciar planos;
- administrar incidentes.

Nao deve acessar dados financeiros sensiveis sem regra clara, auditoria e necessidade operacional.

### Organization owner/admin

Cliente ou Admin da familia/organizacao.

Pode:

- criar membros;
- convidar usuarios;
- gerenciar permissoes;
- configurar categorias;
- ver relatorios da sua organizacao;
- controlar dados financeiros dentro do tenant.

### Member

Usuario comum da organizacao.

Pode apenas o que for liberado por permissao.

## 13. Billing e planos

Billing e importante, mas nao deve entrar antes de multi-tenancy seguro.

### Campos preparatorios possiveis

Em `organizations`:

```txt
plan
status
trial_ends_at
stripe_customer_id
```

Em fase futura:

```txt
plans
subscriptions
billing_events
```

### Planos candidatos

```txt
free
family_basic
family_plus
family_pro
```

### Limites candidatos por plano

- numero de membros financeiros;
- historico em meses;
- exportacoes;
- relatorios avancados;
- notificacoes;
- anexos/comprovantes;
- numero de contas bancarias;
- numero de usuarios com login.

## 14. Activity log e auditoria

`activity_log` e valioso para SaaS, mas deve entrar depois do tenant base.

Campos candidatos:

```txt
id
organization_id
auth_user_id
profile_id
action
entity_type
entity_id
metadata
created_at
```

Usos:

- historico de acoes importantes;
- auditoria familiar;
- suporte;
- notificacoes;
- timeline de atividade;
- seguranca.

Nao implementar na primeira migration multi-tenant para evitar escopo excessivo.

## 15. PWA e shortcuts

O PWA continua relevante mesmo com SaaS.

Shortcuts futuros podem incluir:

```txt
Registrar gasto
Ver contas proximas
Abrir dashboard
Adicionar recebimento
```

Atencao: shortcuts precisam considerar a organizacao ativa.

Exemplo:

```txt
/[orgSlug]/gastos/novo
```

ou fallback:

```txt
/app/redirect?shortcut=expense
```

A implementacao deve ocorrer depois de rotas por organizacao estarem estaveis.

## 16. Design system

A direcao visual recomendada e criar identidade propria sobre Radix/shadcn, sem depender do visual padrao do shadcn.

Fase futura:

```txt
lib/design-tokens.ts
tailwind.config.ts integrado aos tokens
components/ui como primitives
components/app como padroes internos
components/finance como componentes de dominio
```

Principio:

```txt
Nunca importar primitive diretamente nas paginas.
Paginas devem compor componentes de dominio/app.
Primitives ficam isoladas em components/ui.
```

Isso preserva flexibilidade para trocar visual depois sem quebrar regra de negocio.

## 17. Estrutura futura de pastas

Estrutura possivel para SaaS web/PWA:

```txt
app/
  (marketing)/
    page.tsx
    pricing/

  (auth)/
    login/
    sign-up/
    forgot-password/
    update-password/

  (app)/
    [orgSlug]/
      dashboard/
      gastos/
      contas-a-pagar/
      contas-a-receber/
      bancos/
      relatorios/
      configuracoes/
      admin/

  api/
    webhooks/
      stripe/

components/
  ui/
  app/
  finance/
  dashboard/
  expenses/
  payables/
  receivables/
  banks/
  reports/
  settings/
  admin/

lib/
  finance/
  organizations/
  permissions/
  billing/
  supabase/
  utils.ts

supabase/
  migrations/

docs/
```

## 18. Roadmap tecnico de implementacao

### PR 1 - Documentacao SaaS

- Criar estrategia multi-tenant.
- Registrar solicitacao formal de mudanca PMBOK.
- Definir modelo conceitual.
- Definir riscos e fases.

### PR 2 - Plano SQL detalhado

- Criar documento de plano de migration.
- Mapear tabelas impactadas.
- Definir rollback.
- Definir testes SQL e manuais.

### PR 3 - Migration base organizations

- Criar `organizations`.
- Criar `organization_memberships`.
- Criar indices.
- Nao alterar RLS das tabelas financeiras ainda.

### PR 4 - Tenant inicial para dados existentes

- Criar organizacao inicial para dados atuais.
- Criar membership owner/admin.
- Preparar associacao dos dados existentes.

### PR 5 - Adicionar organization_id nullable

- Adicionar `organization_id` nas tabelas existentes.
- Popular com organizacao inicial.
- Criar indices.
- Manter `owner_id` temporariamente.

### PR 6 - Helpers server-side

- Criar helpers de organizacao ativa.
- Resolver membership atual.
- Resolver profile por organizacao.
- Proteger actions por organization.

### PR 7 - Queries financeiras por organization

- Adaptar consultas financeiras.
- Garantir filtros por organization_id.
- Validar dashboard, gastos, contas, bancos, relatorios.

### PR 8 - RLS multi-tenant

- Criar policies por membership.
- Testar isolamento entre organizacoes.
- Manter permissao fina em helpers server-side.

### PR 9 - Rotas com orgSlug

- Introduzir `[orgSlug]`.
- Criar redirecionamento de `/protected` para organizacao ativa.
- Preservar UX atual temporariamente.

### PR 10 - App shell SaaS

- Criar seletor de organizacao, se necessario.
- Ajustar navegacao por orgSlug.
- Validar mobile.

### PR 11 - PWA shortcuts

- Adicionar shortcuts com contexto de organizacao.
- Validar Android/iOS PWA.

### PR 12 - Billing preparatorio

- Criar planos e limites.
- Integrar Stripe apenas quando multi-tenant estiver estavel.

## 19. Riscos especificos da transicao SaaS

| ID | Risco | Impacto | Mitigacao |
|---|---|---:|---|
| SaaS-001 | Vazamento de dados entre organizacoes | Critico | RLS por membership + testes de isolamento |
| SaaS-002 | Migration quebrar dados existentes | Alto | Migration incremental, backups e rollback |
| SaaS-003 | Mistura entre owner_id e organization_id gerar bugs | Alto | Padronizar nomenclatura e fasear remocao |
| SaaS-004 | Mudar rotas antes do banco | Alto | Banco e helpers antes das rotas |
| SaaS-005 | Billing entrar cedo demais | Medio | Billing apenas apos isolamento validado |
| SaaS-006 | Aumento de complexidade quebrar MVP | Alto | PRs pequenas e CI obrigatorio |
| SaaS-007 | Permissoes ficarem inconsistentes por organizacao | Alto | Testes de roles/memberships por org |
| SaaS-008 | Documentacao ficar atrasada | Medio | Atualizar PM docs a cada fase |
| SaaS-009 | Usuario sem organization ativa ficar preso | Medio | Fluxo de onboarding e fallback |
| SaaS-010 | Slugs duplicados ou inseguros | Medio | Unique slug, normalizacao e validacao |

## 20. Criterios de aceite da fase SaaS base

A fase SaaS base so deve ser considerada pronta quando:

- existir tabela `organizations`;
- existir tabela `organization_memberships`;
- dados existentes estiverem vinculados a uma organizacao inicial;
- tabelas financeiras tiverem `organization_id` preenchido;
- queries server-side filtrarem por organizacao;
- actions validarem organizacao e permissao;
- RLS isolar dados por membership;
- usuario de uma organizacao nao conseguir ler dados de outra;
- admin de uma organizacao nao conseguir administrar outra;
- dashboard respeitar organizacao ativa;
- testes automatizados cobrirem isolamento minimo;
- documentacao estiver atualizada;
- CI estiver verde.

## 21. Decisoes que ainda precisam ser fechadas

Antes da primeira migration multi-tenant, decidir:

1. O nome final sera `organizations`?
2. `slug` sera obrigatorio desde o inicio?
3. Um usuario podera participar de varias organizations ja na primeira fase?
4. O cadastro cria organization automaticamente?
5. Convite por email entra agora ou depois?
6. `owner_id` sera mantido por quanto tempo?
7. Qual sera a organization inicial dos dados existentes?
8. Como tratar `ADMIN_EMAIL` no novo modelo?
9. Como redirecionar `/protected` no periodo de transicao?
10. Quais testes minimos serao obrigatorios antes de alterar RLS?

## 22. Decisao recomendada

A recomendacao tecnica e aprovar a evolucao para SaaS multi-tenant, mas implementar em fases, sem SQL destrutivo e sem reescrever a stack.

A ordem recomendada e:

```txt
Documentar -> planejar migration -> criar organizations -> adicionar organization_id -> adaptar servidor -> endurecer RLS -> mudar rotas -> melhorar PWA/design -> billing
```

## 23. Resumo final

O FamilyFinance tem base suficiente para virar SaaS, mas ainda nao e SaaS.

O valor do produto aumenta quando o sistema deixa de ser uma ferramenta privada e passa a suportar varias familias/organizacoes com isolamento real, permissoes, relatorios e futura assinatura.

A transicao correta e tecnica, incremental e documentada. O maior risco nao e implementar multi-tenant; o maior risco e implementar multi-tenant rapido demais, misturando banco, rotas, billing e visual em uma unica mudanca.

Esta estrategia existe para evitar esse erro e transformar o projeto em uma base SaaS profissional, segura e escalavel.
