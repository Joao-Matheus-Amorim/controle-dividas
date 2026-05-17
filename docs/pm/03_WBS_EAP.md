# WBS / EAP - FamilyFinance

Esta EAP representa a estrutura viva do projeto FamilyFinance no estado atual do codigo e da estrategia aprovada.

Legenda:

```txt
[OK] Implementado
[PARCIAL] Implementado parcialmente
[PLANEJADO] Fase futura
[TRANSICAO] Nova fase em planejamento/implantacao incremental
```

## 1. Gestao do Projeto

- [OK] 1.1 Termo de abertura.
- [OK] 1.2 Escopo personalizado inicial.
- [OK] 1.3 Estimativa de custo.
- [OK] 1.4 Plano de riscos.
- [OK] 1.5 Criterios de aceite.
- [OK] 1.6 Roadmap.
- [OK] 1.7 Documentacao de produto.
- [OK] 1.8 Documentacao de arquitetura.
- [OK] 1.9 Solicitacao formal de mudanca SaaS multi-tenant.
- [OK] 1.10 Estrategia tecnica SaaS multi-tenant.
- [PARCIAL] 1.11 Atualizacao continua da documentacao conforme codigo evolui.
- [TRANSICAO] 1.12 Alinhamento dos documentos antigos com a nova fase SaaS.
- [PLANEJADO] 1.13 Plano detalhado de migration multi-tenant.
- [PLANEJADO] 1.14 Plano de rollback da transicao multi-tenant.
- [PLANEJADO] 1.15 Aceite formal da fase SaaS base.

## 2. Fundacao Tecnica Web/PWA

- [OK] 2.1 Next.js App Router.
- [OK] 2.2 React.
- [OK] 2.3 TypeScript.
- [OK] 2.4 Tailwind CSS.
- [OK] 2.5 Componentes UI base.
- [OK] 2.6 Componentes de app.
- [OK] 2.7 Componentes financeiros.
- [OK] 2.8 PWA manifest.
- [OK] 2.9 Configuracao Vercel.
- [OK] 2.10 Deploy automatico desativado em `vercel.json`.
- [TRANSICAO] 2.11 Preparacao do Web/PWA como primeira interface SaaS.
- [PLANEJADO] 2.12 Rotas por organizacao com `[orgSlug]`.
- [PLANEJADO] 2.13 App shell SaaS por organizacao ativa.
- [PLANEJADO] 2.14 Shortcuts PWA com contexto de organizacao.

## 3. Supabase e Banco de Dados

- [OK] 3.1 Supabase Auth.
- [OK] 3.2 Supabase Database.
- [OK] 3.3 Supabase SSR.
- [OK] 3.4 Supabase Server Client.
- [OK] 3.5 Supabase Browser Client.
- [OK] 3.6 Supabase Admin Client com service role server-side.
- [OK] 3.7 Row Level Security inicial.
- [OK] 3.8 Migration 001 - schema financeiro.
- [OK] 3.9 Migration 002 - dedupe e constraints de seed.
- [OK] 3.10 Migration 003 - profiles e permissoes.
- [OK] 3.11 Migration 004 - escopo e feature permissions.
- [OK] 3.12 Migration 005 - tipos de contas a pagar.
- [TRANSICAO] 3.13 Diagnostico: modelo atual single-tenant com multi-user familiar.
- [PLANEJADO] 3.14 Migration 006 - `organizations` e `organization_memberships`.
- [PLANEJADO] 3.15 Criacao de organizacao inicial para dados existentes.
- [PLANEJADO] 3.16 Adicao de `organization_id` nullable nas tabelas financeiras.
- [PLANEJADO] 3.17 Backfill de `organization_id` para dados existentes.
- [PLANEJADO] 3.18 Indices por `organization_id`.
- [PLANEJADO] 3.19 RLS multi-tenant por membership.
- [PLANEJADO] 3.20 Remocao gradual da dependencia de `owner_id` como eixo principal.
- [PARCIAL] 3.21 Reforco futuro de RLS com regras mais finas por perfil/membro.

## 4. Autenticacao e Sessao

- [OK] 4.1 Login.
- [OK] 4.2 Cadastro.
- [OK] 4.3 Validacao de e-mail autorizado pelo Admin.
- [OK] 4.4 Confirmacao de e-mail/token via Supabase.
- [OK] 4.5 Recuperacao de senha.
- [OK] 4.6 Atualizacao de senha.
- [OK] 4.7 Pagina de erro de autenticacao.
- [OK] 4.8 Protecao global via `proxy.ts`.
- [OK] 4.9 Sincronizacao de cookies/sessao via `lib/supabase/proxy.ts`.
- [OK] 4.10 Vinculo `auth.users` -> `profiles`.
- [OK] 4.11 Bloqueio de e-mail nao autorizado no modelo familiar inicial.
- [OK] 4.12 Bloqueio de perfil inativo.
- [TRANSICAO] 4.13 Planejamento de cadastro com criacao/entrada em organizacao.
- [PLANEJADO] 4.14 Resolucao de organizacao ativa por slug/cookie/membership.
- [PLANEJADO] 4.15 Suporte a usuario em multiplas organizacoes.
- [PLANEJADO] 4.16 Convites por e-mail por organizacao.
- [PLANEJADO] 4.17 Onboarding SaaS com criacao de organizacao.

## 5. MVP Financeiro Web/PWA

- [OK] 5.1 Dashboard contextual.
- [OK] 5.2 Pessoas/membros financeiros.
- [OK] 5.3 Limites mensais por pessoa.
- [OK] 5.4 Categorias de gastos.
- [OK] 5.5 Gastos.
- [OK] 5.6 Contas a pagar.
- [OK] 5.7 Contas a receber/rendas.
- [OK] 5.8 Bancos/saldos.
- [OK] 5.9 Relatorios consolidados.
- [OK] 5.10 Configuracoes basicas.
- [PARCIAL] 5.11 Periodo dinamico no Dashboard e Relatorios.
- [PARCIAL] 5.12 Filtros avancados.
- [PARCIAL] 5.13 Exportacao de relatorios.
- [PARCIAL] 5.14 Graficos financeiros.
- [TRANSICAO] 5.15 Preparacao dos modulos financeiros para `organization_id`.
- [PLANEJADO] 5.16 Dashboard por organizacao ativa.
- [PLANEJADO] 5.17 Relatorios isolados por organizacao.
- [PLANEJADO] 5.18 Validacao cross-tenant em todos os modulos.

## 6. CRUDs e Acoes Financeiras

- [OK] 6.1 Criar membro financeiro.
- [OK] 6.2 Editar membro financeiro.
- [OK] 6.3 Ativar/desativar membro financeiro.
- [OK] 6.4 Criar categoria.
- [OK] 6.5 Excluir categoria.
- [PARCIAL] 6.6 Editar categoria.
- [OK] 6.7 Criar gasto.
- [OK] 6.8 Excluir gasto.
- [PARCIAL] 6.9 Editar gasto completo.
- [OK] 6.10 Criar conta a pagar.
- [OK] 6.11 Alterar status de conta a pagar.
- [OK] 6.12 Excluir conta a pagar.
- [PARCIAL] 6.13 Editar conta a pagar completa.
- [OK] 6.14 Criar conta a receber.
- [OK] 6.15 Alterar status de conta a receber.
- [OK] 6.16 Excluir conta a receber.
- [PARCIAL] 6.17 Editar conta a receber completa.
- [OK] 6.18 Criar banco/conta bancaria.
- [OK] 6.19 Atualizar saldo bancario.
- [OK] 6.20 Excluir banco/conta bancaria.
- [PARCIAL] 6.21 Editar banco completo.
- [PLANEJADO] 6.22 Validar todas as actions por organizacao ativa.
- [PLANEJADO] 6.23 Impedir mutacoes cross-tenant em Server Actions.
- [PLANEJADO] 6.24 Testar fluxo de CRUD por duas organizacoes distintas.

## 7. Admin Familiar / Admin da Organizacao

- [OK] 7.1 Garantir Admin principal por `ADMIN_EMAIL` no modelo familiar inicial.
- [OK] 7.2 Painel Admin.
- [OK] 7.3 Criar usuario familiar.
- [OK] 7.4 Editar usuario familiar.
- [OK] 7.5 Excluir usuario familiar.
- [OK] 7.6 Ativar/desativar usuario familiar.
- [OK] 7.7 Vincular usuario familiar a membro financeiro.
- [OK] 7.8 Sincronizar usuario familiar com Supabase Auth.
- [OK] 7.9 Listar usuarios familiares.
- [OK] 7.10 Tela de permissoes.
- [OK] 7.11 Salvar permissoes por modulo.
- [OK] 7.12 Salvar permissoes por acao.
- [OK] 7.13 Salvar escopo de dados.
- [OK] 7.14 Salvar membros liberados em escopo `selected`.
- [TRANSICAO] 7.15 Reposicionar Admin familiar como Admin da organizacao.
- [PLANEJADO] 7.16 Separar Platform admin de Organization admin.
- [PLANEJADO] 7.17 Gerenciar memberships por organizacao.
- [PLANEJADO] 7.18 Gerenciar convites por organizacao.

## 8. Sistema de Permissoes

- [OK] 8.1 Modelo `profiles`.
- [OK] 8.2 Modelo `user_module_permissions`.
- [OK] 8.3 Modelo `user_feature_permissions`.
- [OK] 8.4 Roles `admin`, `adult`, `child`, `custom`, `user`.
- [OK] 8.5 Acoes `can_view`, `can_create`, `can_edit`, `can_delete`.
- [OK] 8.6 Escopos `own`, `selected`, `family`.
- [OK] 8.7 `allowed_member_ids`.
- [OK] 8.8 Helper `getCurrentProfile`.
- [OK] 8.9 Helper `getVisibleModuleKeys`.
- [OK] 8.10 Helper `getAccessibleMemberIds`.
- [OK] 8.11 Helper `assertCanAccessMember`.
- [OK] 8.12 Helper `canUseFeature`.
- [OK] 8.13 Menu dinamico por modulo.
- [OK] 8.14 Queries financeiras filtradas por escopo.
- [OK] 8.15 Server Actions protegidas por permissao.
- [PARCIAL] 8.16 UI completa para `user_feature_permissions`.
- [PARCIAL] 8.17 Aplicacao ampla de `canUseFeature` na interface.
- [TRANSICAO] 8.18 Planejar permissao dentro de `organization_id`.
- [PLANEJADO] 8.19 `profiles` por organizacao.
- [PLANEJADO] 8.20 `user_module_permissions` por organizacao.
- [PLANEJADO] 8.21 `user_feature_permissions` por organizacao.
- [PLANEJADO] 8.22 Memberships com role por organizacao.

## 9. UI/UX Mobile-first

- [OK] 9.1 Tema escuro atual.
- [OK] 9.2 Cards arredondados.
- [OK] 9.3 Bottom navigation mobile.
- [OK] 9.4 Navegacao desktop.
- [OK] 9.5 Formularios em dialog/modal.
- [OK] 9.6 Estados vazios.
- [OK] 9.7 Cards de metricas.
- [OK] 9.8 Protecao contra rolagem horizontal.
- [PARCIAL] 9.9 Refinamento fino de acessibilidade.
- [PARCIAL] 9.10 Feedbacks mais completos de erro/sucesso.
- [TRANSICAO] 9.11 UX por organizacao ativa.
- [PLANEJADO] 9.12 App shell SaaS com `orgSlug`.
- [PLANEJADO] 9.13 PWA shortcuts por organizacao.
- [PLANEJADO] 9.14 Design tokens proprios.
- [PLANEJADO] 9.15 Sheet/mobile forms por fluxo.

## 10. Testes e Qualidade

- [OK] 10.1 Vitest configurado.
- [OK] 10.2 Testing Library configurado.
- [OK] 10.3 MSW configurado.
- [OK] 10.4 Testes unitarios de calculos.
- [OK] 10.5 Testes unitarios de permissoes/RBAC.
- [OK] 10.6 Testes unitarios de mock data.
- [OK] 10.7 Teste de integracao de Dashboard.
- [OK] 10.8 Teste de integracao de fluxo de permissoes.
- [PARCIAL] 10.9 Testes de Server Actions reais.
- [PARCIAL] 10.10 Testes E2E.
- [PLANEJADO] 10.11 Testes de isolamento entre organizacoes.
- [PLANEJADO] 10.12 Testes de membership por organizacao.
- [PLANEJADO] 10.13 Testes de RLS multi-tenant.
- [PLANEJADO] 10.14 Testes de queries/actions por `organization_id`.

## 11. Documentacao

- [OK] 11.1 README atualizado.
- [OK] 11.2 Visao do produto.
- [OK] 11.3 Estrategia de permissoes e dashboard.
- [OK] 11.4 Admin e permissoes.
- [OK] 11.5 Canais de acesso.
- [OK] 11.6 Estrategia mobile.
- [OK] 11.7 UX mobile-first.
- [OK] 11.8 Distribuicao gratuita/PWA.
- [OK] 11.9 Estimativa de custo.
- [OK] 11.10 Validacao tecnica.
- [OK] 11.11 Arquitetura tecnica.
- [OK] 11.12 PM docs.
- [OK] 11.13 Estrategia SaaS multi-tenant.
- [OK] 11.14 Solicitacao formal de mudanca SaaS multi-tenant.
- [PARCIAL] 11.15 Manter docs estrategicos sincronizados com codigo.
- [PLANEJADO] 11.16 Plano SQL multi-tenant detalhado.
- [PLANEJADO] 11.17 Plano de testes multi-tenant.
- [PLANEJADO] 11.18 Atualizacao completa do README para SaaS.

## 12. SaaS Multi-tenant

- [OK] 12.1 Diagnostico do modelo atual.
- [OK] 12.2 Decisao de uso de `organizations` como entidade principal recomendada.
- [OK] 12.3 Modelo conceitual multi-tenant documentado.
- [OK] 12.4 Roadmap tecnico de transicao documentado.
- [TRANSICAO] 12.5 Alinhamento de documentos estrategicos antigos.
- [PLANEJADO] 12.6 Plano SQL detalhado.
- [PLANEJADO] 12.7 Migration `organizations`.
- [PLANEJADO] 12.8 Migration `organization_memberships`.
- [PLANEJADO] 12.9 Backfill de organizacao inicial.
- [PLANEJADO] 12.10 `organization_id` nas tabelas financeiras.
- [PLANEJADO] 12.11 Helpers server-side de organizacao ativa.
- [PLANEJADO] 12.12 Queries/actions por organizacao.
- [PLANEJADO] 12.13 RLS multi-tenant.
- [PLANEJADO] 12.14 Rotas com `[orgSlug]`.
- [PLANEJADO] 12.15 Billing preparatorio.

## 13. App Nativo Futuro

- [PLANEJADO] 13.1 Estrutura React Native/Expo.
- [PLANEJADO] 13.2 Expo Router.
- [PLANEJADO] 13.3 Autenticacao mobile.
- [PLANEJADO] 13.4 Navegacao mobile.
- [PLANEJADO] 13.5 Dashboard mobile.
- [PLANEJADO] 13.6 Lancamento rapido de gastos.
- [PLANEJADO] 13.7 Contas e bancos.
- [PLANEJADO] 13.8 Relatorios simples.
- [PLANEJADO] 13.9 Build Android.
- [PLANEJADO] 13.10 Build iOS.

## 14. Modulos Futuros

- [PLANEJADO] 14.1 Contas fixas avancadas.
- [PLANEJADO] 14.2 Dividas avancadas.
- [PLANEJADO] 14.3 Metas.
- [PLANEJADO] 14.4 Alertas.
- [PLANEJADO] 14.5 Investimentos.
- [PLANEJADO] 14.6 Acoes.
- [PLANEJADO] 14.7 Cotacoes.
- [PLANEJADO] 14.8 Graficos avancados.
- [PLANEJADO] 14.9 Exportacao PDF/Excel.
- [PLANEJADO] 14.10 Notificacoes.
- [PLANEJADO] 14.11 Activity log/auditoria.
- [PLANEJADO] 14.12 Planos e limites SaaS.

## 15. Aceite e Release

- [PARCIAL] 15.1 Lint aprovado.
- [PARCIAL] 15.2 Build aprovado.
- [PARCIAL] 15.3 Testes aprovados.
- [PARCIAL] 15.4 Teste manual por modulo.
- [PARCIAL] 15.5 Validacao com Admin familiar/organizacao.
- [PARCIAL] 15.6 Deploy manual controlado.
- [PARCIAL] 15.7 Aceite formal.
- [PLANEJADO] 15.8 Aceite da fase SaaS base.
- [PLANEJADO] 15.9 Validacao cross-tenant.
- [PLANEJADO] 15.10 Validacao de rollback de migration.
