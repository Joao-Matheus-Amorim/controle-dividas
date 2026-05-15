# WBS / EAP - FamilyFinance

Esta EAP representa a estrutura viva do projeto FamilyFinance no estado atual do codigo.

Legenda:

```txt
[OK] Implementado
[PARCIAL] Implementado parcialmente
[PLANEJADO] Fase futura
```

## 1. Gestao do Projeto

- [OK] 1.1 Termo de abertura.
- [OK] 1.2 Escopo personalizado.
- [OK] 1.3 Estimativa de custo.
- [OK] 1.4 Plano de riscos.
- [OK] 1.5 Criterios de aceite.
- [OK] 1.6 Roadmap.
- [OK] 1.7 Documentacao de produto.
- [OK] 1.8 Documentacao de arquitetura.
- [PARCIAL] 1.9 Atualizacao continua da documentacao conforme codigo evolui.

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
- [PARCIAL] 3.12 Reforco futuro de RLS com regras mais finas por perfil/membro.

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
- [OK] 4.11 Bloqueio de e-mail nao autorizado.
- [OK] 4.12 Bloqueio de perfil inativo.

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

## 7. Admin Familiar

- [OK] 7.1 Garantir Admin principal por `ADMIN_EMAIL`.
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
- [PARCIAL] 11.13 Manter docs estrategicos sincronizados com codigo.

## 12. App Nativo Futuro

- [PLANEJADO] 12.1 Estrutura React Native/Expo.
- [PLANEJADO] 12.2 Expo Router.
- [PLANEJADO] 12.3 Autenticacao mobile.
- [PLANEJADO] 12.4 Navegacao mobile.
- [PLANEJADO] 12.5 Dashboard mobile.
- [PLANEJADO] 12.6 Lancamento rapido de gastos.
- [PLANEJADO] 12.7 Contas e bancos.
- [PLANEJADO] 12.8 Relatorios simples.
- [PLANEJADO] 12.9 Build Android.
- [PLANEJADO] 12.10 Build iOS.

## 13. Modulos Futuros

- [PLANEJADO] 13.1 Contas fixas.
- [PLANEJADO] 13.2 Dividas.
- [PLANEJADO] 13.3 Metas.
- [PLANEJADO] 13.4 Alertas.
- [PLANEJADO] 13.5 Investimentos.
- [PLANEJADO] 13.6 Acoes.
- [PLANEJADO] 13.7 Cotacoes.
- [PLANEJADO] 13.8 Graficos avancados.
- [PLANEJADO] 13.9 Exportacao PDF/Excel.
- [PLANEJADO] 13.10 Notificacoes.

## 14. Aceite e Release

- [PARCIAL] 14.1 Lint aprovado.
- [PARCIAL] 14.2 Build aprovado.
- [PARCIAL] 14.3 Testes aprovados.
- [PARCIAL] 14.4 Teste manual por modulo.
- [PARCIAL] 14.5 Validacao com Admin familiar.
- [PARCIAL] 14.6 Deploy manual controlado.
- [PARCIAL] 14.7 Aceite formal.
