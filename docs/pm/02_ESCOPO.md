# Escopo - FamilyFinance

> Status DocDoc: Historico/PM
> Uso seguro: contexto de escopo, inclusoes e exclusoes originais.
> Observacao: nao e contrato tecnico atual; confirme estado vigente em
> `docs/VALIDACAO_TECNICA.md`, `docs/SAAS_GAP_REGISTER.md` e no codigo.

## Declaracao de escopo

O FamilyFinance nasceu como uma solucao financeira familiar personalizada para uma unica familia, com Web/PWA funcional em validacao, painel Admin familiar implementado e app nativo Android/iOS planejado para fase futura.

Apos a solicitacao formal registrada em `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md` e a estrategia tecnica registrada em `docs/SAAS_MULTI_TENANT_STRATEGY.md`, o escopo passa a reconhecer uma nova fase estrategica: evoluir o FamilyFinance para um SaaS multi-tenant de gestao financeira familiar.

Essa mudanca de escopo nao significa implementar tudo de uma vez. A transicao para SaaS deve ser incremental, documentada, validada por testes, sem SQL destrutivo e sem misturar banco, rotas, RLS, billing e visual em uma unica mudanca.

## Escopo por fase

### Fase anterior - MVP familiar privado

```txt
Solucao familiar privada, single-tenant, com multi-user familiar.
```

Essa fase criou e validou a base atual do produto.

### Fase atual - Preparacao SaaS multi-tenant

```txt
Documentar, planejar e implementar a base multi-tenant de forma incremental.
```

O objetivo da fase atual e transformar a arquitetura para suportar varias organizacoes/familias isoladas, preservando o MVP atual sempre que possivel.

### Fase futura - SaaS comercial

```txt
Planos, billing, landing comercial, onboarding publico e crescimento.
```

Essa fase so deve iniciar depois de multi-tenancy, RLS, queries/actions e rotas por organizacao estarem validadas.

## Produto atual

O produto atual e um MVP Web/PWA mobile-first com:

- autenticacao Supabase;
- proxy global de sessao;
- Dashboard financeiro contextual;
- Pessoas;
- Gastos;
- Contas a pagar;
- Contas a receber;
- Bancos;
- Relatorios;
- Configuracoes;
- Admin familiar;
- Usuarios familiares;
- Permissoes por modulo;
- Permissoes por acao;
- Escopo de dados por permissao;
- Migrations Supabase;
- Testes unitarios e de integracao.

## Produto alvo atualizado

O produto alvo passa a ser uma plataforma SaaS/PWA mobile-first de gestao financeira familiar, com:

- Web/PWA como primeira interface funcional;
- app nativo Android/iOS em fase futura;
- backend Supabase;
- banco PostgreSQL com RLS;
- organizacoes/familias isoladas;
- usuarios associados a organizacoes por memberships;
- permissoes centralizadas por organizacao;
- dados financeiros protegidos por organization;
- dashboard contextual por usuario e organizacao;
- possibilidade futura de planos comerciais;
- possibilidade futura de billing;
- possibilidade futura de shortcuts PWA e app nativo.

## Dentro do escopo atual implementado

### Fundacao tecnica

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- Supabase Auth.
- Supabase Database.
- Supabase SSR.
- Supabase service role server-side.
- Row Level Security.
- Migrations.
- Proxy global de sessao.
- PWA manifest.
- CI com lint, build, audit e testes.

### Autenticacao

- Login.
- Cadastro.
- Validacao de e-mail autorizado pelo Admin.
- Confirmacao via Supabase OTP.
- Recuperacao de senha.
- Atualizacao de senha.
- Pagina de erro de auth.
- Vinculo entre `auth.users` e `profiles` familiares.

### Financeiro

- Membros financeiros.
- Limites mensais.
- Categorias de gastos.
- Gastos.
- Contas a pagar.
- Contas a receber/rendas.
- Bancos/saldos.
- Dashboard.
- Relatorios.
- Configuracoes basicas.

### Admin familiar

- Perfil Admin principal por `ADMIN_EMAIL`.
- Criacao de usuarios familiares.
- Vinculo usuario -> membro financeiro.
- Ativacao/desativacao de usuarios.
- Sincronizacao com Auth user pelo e-mail.
- Permissoes por modulo.
- Permissoes por acao.
- Escopo de dados: `own`, `selected`, `family`.
- Selecao de membros liberados por escopo.
- Menu dinamico por permissao.

### Qualidade

- Testes unitarios de calculos.
- Testes unitarios de RBAC.
- Testes de integracao de Dashboard.
- Testes de integracao de permissoes.
- MSW para simular Supabase REST.
- Quality Gate no GitHub Actions.

## Dentro do escopo atual de transicao SaaS

A fase atual de transicao SaaS inclui:

- documentacao estrategica SaaS;
- solicitacao formal de mudanca PMBOK;
- plano SQL detalhado antes de migration real;
- definicao da entidade `organizations`;
- definicao de `organization_memberships`;
- estrategia para `organization_id` nas tabelas financeiras;
- estrategia de backfill dos dados atuais;
- plano de helpers server-side para organizacao ativa;
- plano de RLS por membership;
- plano de rotas futuras com `[orgSlug]`;
- criterios de aceite para isolamento multi-tenant;
- definicao de riscos da transicao.

## Dentro do escopo atual parcial

- Edicao completa de gastos.
- Edicao completa de contas a pagar.
- Edicao completa de contas a receber.
- Edicao completa de bancos.
- Edicao completa de categorias.
- UI completa para `user_feature_permissions`.
- Filtros avancados de relatorios.
- Exportacao de relatorios.
- Periodo dinamico no Dashboard e Relatorios.
- Separacao completa entre codigo mockado e codigo de producao.
- Aplicacao real de multi-tenancy no banco e no servidor.
- Rotas por `orgSlug`.
- RLS baseada em organization membership.

## Dentro do escopo futuro

- Contas fixas avancadas.
- Dividas avancadas.
- Metas financeiras.
- Alertas financeiros.
- Investimentos.
- Acoes.
- Cotacoes.
- Graficos avancados.
- Projecoes financeiras.
- Convites por e-mail.
- Notificacoes.
- App React Native/Expo.
- Builds Android/iOS.
- Billing com Stripe ou provedor equivalente.
- Planos comerciais.
- Landing page comercial.
- Activity log/auditoria operacional.
- PWA shortcuts por organizacao.

## Fora do escopo imediato

Os itens abaixo fazem parte da visao de SaaS, mas nao devem ser implementados antes da base multi-tenant estar segura:

- Assinatura paga em producao.
- Stripe em producao.
- Area comercial completa.
- Marketplace.
- Integracao bancaria automatica.
- Open Finance.
- IA financeira.
- Publicidade.
- Multi-empresa contabil.
- Controle contabil empresarial.
- Uso como produto financeiro regulado.
- App nativo completo.
- Reescrita de stack.
- Redesign completo.

## Limites de arquitetura

- `SUPABASE_SERVICE_ROLE_KEY` deve existir apenas no servidor.
- A permissao deve ser validada em Server Components, Server Actions e helpers server-side.
- O frontend pode esconder elementos, mas nao pode ser a unica camada de seguranca.
- RLS deve permanecer ativa no Supabase.
- Na fase atual, dados ainda dependem de `owner_id`.
- Na fase SaaS, dados devem passar a depender de `organization_id`.
- `owner_id` pode permanecer temporariamente por compatibilidade, mas nao deve ser o eixo final do SaaS.
- O acesso entre organizacoes deve ser impossivel por RLS e por validacao server-side.
- Billing nao deve ser implementado antes de isolamento multi-tenant validado.

## Criterio de mudanca de escopo

A decisao de evoluir para SaaS multi-tenant ja foi registrada como mudanca grande de escopo em:

- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`

A estrategia tecnica foi registrada em:

- `docs/SAAS_MULTI_TENANT_STRATEGY.md`

Novas decisoes que ampliem ainda mais o escopo continuam exigindo nova analise, especialmente itens como:

- processamento financeiro regulado;
- Open Finance;
- integracao bancaria automatica;
- app nativo completo;
- modulo de investimentos com cotacoes reais;
- billing em producao;
- plataforma publica para multiplos segmentos alem do financeiro familiar.

## Regra de implementacao

A transicao SaaS deve seguir a ordem:

```txt
Documentacao -> Plano SQL -> organizations -> memberships -> organization_id -> backfill -> helpers server-side -> queries/actions -> RLS -> rotas -> PWA/UX -> billing
```

Qualquer PR que pule etapas, misture responsabilidades demais ou altere banco sem plano de rollback deve ser considerada fora do processo aprovado.
