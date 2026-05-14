# FamilyFinance

Aplicativo financeiro familiar personalizado para uma familia especifica, com painel web administrativo e evolucao planejada para app nativo Android e iOS.

## Visao do projeto

O FamilyFinance nao e um SaaS e nao sera tratado, nesta fase, como produto para venda publica.

O objetivo e criar uma solucao sob medida para uma familia, permitindo que um Admin familiar controle:

- membros da familia;
- limites mensais;
- gastos;
- contas a pagar;
- contas a receber;
- bancos;
- relatorios;
- categorias;
- permissoes de visualizacao, criacao, edicao e exclusao por usuario.

## Produto final desejado

A direcao do projeto e mobile-first:

- App nativo Android e iOS para uso diario da familia.
- Painel web para administracao, configuracoes e validacao das regras.
- Backend em Supabase compartilhado entre web e mobile.

## Status atual

O MVP web ja possui os principais modulos financeiros:

- Dashboard familiar.
- Pessoas.
- Gastos.
- Contas a pagar.
- Contas a receber.
- Bancos.
- Relatorios.
- Configuracoes.

## Admin familiar

O Admin continua sendo parte central do sistema.

Ele sera responsavel por:

- ver o dashboard consolidado;
- criar usuarios familiares;
- vincular usuarios a membros financeiros;
- alterar limites mensais;
- gerenciar categorias;
- gerenciar bancos;
- liberar ou bloquear modulos;
- definir quem pode ver, criar, editar ou excluir dados;
- validar relatorios da familia.

## Usuarios familiares

Usuarios familiares poderao ter acesso limitado conforme configuracao do Admin.

Exemplo:

- Pai pode ver e criar gastos, mas nao excluir.
- Mae pode ver contas da casa e editar alguns lancamentos.
- Gabryel pode lancar seus proprios gastos.
- Caleb pode existir apenas como membro financeiro, sem login obrigatorio.

## Escopo desta fase

Dentro do escopo:

- projeto personalizado para uma unica familia;
- Admin familiar;
- membros financeiros;
- permissoes por modulo e acao;
- app nativo planejado;
- painel web administrativo;
- backend Supabase;
- documentacao de projeto.

Fora do escopo desta fase:

- SaaS publico;
- multiplas familias independentes;
- planos pagos;
- assinatura;
- area comercial;
- venda em escala;
- integracao bancaria automatica;
- Open Finance;
- IA financeira.

## Stack atual

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Database
- Row Level Security

## Stack mobile planejada

- React Native
- Expo
- Expo Router
- Supabase JS
- EAS Build
- Android
- iOS

## Documentacao principal

- `docs/PRODUCT_VISION.md`
- `docs/MOBILE_STRATEGY.md`
- `docs/COST_ESTIMATE.md`
- `docs/ADMIN_PERMISSIONS.md`
- `docs/pm/01_TERMO_DE_ABERTURA.md`
- `docs/pm/02_ESCOPO_PERSONALIZADO.md`
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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICA_DO_SUPABASE
```

Execute as migrations no Supabase SQL Editor:

```txt
supabase/migrations/001_family_finance_schema.sql
supabase/migrations/002_dedupe_and_seed_constraints.sql
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

## Decisao atual

Antes de iniciar a implementacao mobile, o projeto deve ser documentado e aprovado como solucao personalizada para uma familia, com Admin familiar e permissoes por modulo.
