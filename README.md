# FamilyFinance

Aplicativo financeiro familiar personalizado, mobile-first, para uma familia especifica.

O produto final desejado e um app nativo Android/iOS para uso diario da familia. A web atual sera mantida como painel Admin privado do Danyel, responsavel por configuracoes, membros, usuarios, permissoes, limites e relatorios.

## Decisao atual do produto

FamilyFinance nao e SaaS nesta fase.

Nao sera tratado como sistema para venda publica, multiplas familias, assinatura ou produto comercial escalavel.

O projeto sera entregue como solucao personalizada para uma familia, com:

- app mobile para uso diario;
- web Admin para Danyel;
- Supabase como backend;
- permissoes por modulo e por acao;
- experiencia visual mobile-first.

## Canais de acesso

### App Mobile Familiar

Todos os membros com login usam o app nativo, incluindo Danyel.

O app deve permitir:

- login;
- dashboard individual;
- lancamento rapido de gastos;
- consulta de saldo;
- consulta de contas autorizadas;
- consulta de bancos autorizados;
- execucao de acoes conforme permissao.

Danyel tambem usa o app como membro financeiro. Por possuir perfil Admin, o app dele exibira um atalho Admin.

### Web Admin

A web e o painel administrativo privado do Danyel.

Ela permite:

- criar membros financeiros;
- criar usuarios familiares;
- vincular usuarios a membros;
- configurar permissoes;
- ajustar limites;
- gerenciar categorias;
- gerenciar bancos;
- ver relatorios consolidados;
- administrar regras da familia.

## Atalho Admin no app

O app nao tera uma area Admin completa embutida.

Se o usuario logado tiver `profile.role = admin`, o app exibira um atalho Admin.

Ao tocar nesse atalho, o app abrira:

```txt
https://controle-dividas-seven.vercel.app/protected/admin
```

A recomendacao inicial e abrir no navegador externo. WebView pode ser considerada depois.

## Design e UX

O FamilyFinance deve parecer app, nao landing page.

Diretrizes:

- mobile-first;
- autenticacao simples;
- sem copy de marketing;
- telas limpas;
- cards arredondados;
- botoes grandes;
- poucos textos;
- acoes rapidas;
- experiencia parecida com app financeiro moderno.

## Status atual

MVP web em validacao com:

- Dashboard familiar;
- Pessoas;
- Gastos;
- Contas a pagar;
- Contas a receber;
- Bancos;
- Relatorios;
- Configuracoes;
- Admin familiar;
- Usuarios familiares;
- Permissoes por modulo e acao.

## Stack atual

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Database
- Row Level Security
- Vercel

## Stack mobile planejada

- React Native
- Expo
- Expo Router
- Supabase JS
- Expo Go para teste gratuito
- EAS Build quando necessario
- Android
- iOS

## Caminho gratuito para simular como app

Antes de publicar em App Store ou Google Play, o FamilyFinance pode ser validado gratuitamente por:

1. Web app aberto no celular.
2. Adicionar a tela inicial do iPhone/Android.
3. PWA com manifesto e icones.
4. Expo Go para testar app nativo em desenvolvimento.
5. Build Android de teste em fase posterior.

## Documentacao principal

- `docs/PRODUCT_VISION.md`
- `docs/MOBILE_STRATEGY.md`
- `docs/MOBILE_FIRST_UX.md`
- `docs/FREE_APP_DISTRIBUTION.md`
- `docs/ACCESS_CHANNELS.md`
- `docs/COST_ESTIMATE.md`
- `docs/ADMIN_PERMISSIONS.md`
- `docs/pm/01_TERMO_DE_ABERTURA.md`
- `docs/pm/02_ESCOPO.md`
- `docs/pm/03_WBS_EAP.md`
- `docs/pm/04_REQUISITOS.md`
- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`
- `docs/pm/06_ACEITE_ROADMAP.md`

## Como rodar localmente

Instale as dependencias:

```bash
npm install
```

Configure `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=URL_DO_SUPABASE
NEXT_PUBLIC_SUPABASE_ANON_KEY=CHAVE_ANON_PUBLICA_DO_SUPABASE
ADMIN_EMAIL=EMAIL_DO_DANYEL
```

Tambem e aceito:

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICA_DO_SUPABASE
```

Execute as migrations no Supabase SQL Editor:

```txt
supabase/migrations/001_family_finance_schema.sql
supabase/migrations/002_dedupe_and_seed_constraints.sql
supabase/migrations/003_admin_profiles_permissions.sql
```

Rode o projeto:

```bash
npm run dev
```

Valide qualidade:

```bash
npm run lint
npm run build
```

## Regra de ouro

Supabase e infraestrutura tecnica.

Danyel administra pela web.

A familia usa o app.

O app deve ser bonito, simples, fluido e mobile-first.
