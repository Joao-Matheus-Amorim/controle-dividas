# Escopo - FamilyFinance

## Declaracao de escopo

O FamilyFinance e uma solucao financeira familiar personalizada para uma unica familia, com Web/PWA funcional em validacao, painel Admin familiar implementado e app nativo Android/iOS planejado para fase futura.

O sistema nao sera tratado, nesta fase, como SaaS publico, multi-tenant comercial, produto por assinatura ou plataforma para multiplas familias.

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

## Produto alvo

O produto alvo continua sendo uma experiencia familiar mobile-first, com:

- Web/PWA como validacao e painel Admin;
- app nativo Android/iOS em fase futura;
- backend Supabase;
- permissoes centralizadas;
- dados financeiros protegidos;
- dashboard contextual por usuario.

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

## Dentro do escopo futuro

- Contas fixas.
- Dividas.
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

## Fora do escopo inicial

- SaaS publico.
- Multiplas familias.
- Assinatura comercial.
- Marketplace.
- Area comercial.
- Integracao bancaria automatica.
- Open Finance.
- IA financeira.
- Publicidade.
- Multi-empresa.
- Controle contabil empresarial.
- Uso como produto financeiro regulado.

## Limites de arquitetura

- `SUPABASE_SERVICE_ROLE_KEY` deve existir apenas no servidor.
- A permissao deve ser validada em Server Components, Server Actions e helpers server-side.
- O frontend pode esconder elementos, mas nao pode ser a unica camada de seguranca.
- RLS deve permanecer ativa no Supabase.
- Admin pode tudo apenas dentro da familia configurada.
- Usuario comum acessa apenas o que foi liberado.

## Criterio de mudanca de escopo

Qualquer decisao que mova o projeto para:

- SaaS;
- multiplas familias;
- assinatura;
- produto publico;
- integracao bancaria automatica;
- processamento financeiro regulado;
- app nativo completo;
- modulo de investimentos com cotacoes reais;

precisa ser tratada como nova fase, com nova estimativa, novos riscos, novo aceite e atualizacao da documentacao.
