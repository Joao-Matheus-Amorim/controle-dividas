# FamilyFinance

Aplicativo financeiro familiar personalizado, mobile-first, para uma familia especifica.

O FamilyFinance deve evoluir para uma central financeira familiar com controle individual por pessoa, permissoes dinamicas, dashboard contextual, contas fixas, contas a pagar, contas a receber, bancos, rendas, investimentos, acoes, graficos, alertas e relatorios.

## Decisao atual do produto

FamilyFinance nao e SaaS nesta fase.

Nao sera tratado como sistema para venda publica, multiplas familias, assinatura ou produto comercial escalavel.

O projeto sera entregue como solucao personalizada para uma familia, com:

- app mobile/PWA para uso diario;
- web Admin para Danyel;
- Supabase como backend;
- permissoes por modulo, acao, funcionalidade e escopo de dados;
- dashboard contextual por usuario;
- experiencia visual mobile-first e com cara de app nativo.

## Deploy automatico na Vercel

O deploy automatico da Vercel deve permanecer desativado durante a fase atual de desenvolvimento.

Motivo: o projeto esta em fase de mudancas frequentes de arquitetura, permissao, UI e banco. Se cada commit gerar um deploy automatico, o limite de builds/deploys da conta gratuita pode ser excedido rapidamente.

Por isso, o projeto usa `vercel.json` com:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": false
  }
}
```

Fluxo recomendado:

1. desenvolver localmente;
2. rodar `npm run lint`;
3. rodar `npm run build`;
4. testar no navegador/celular;
5. somente quando uma fase estiver estavel, fazer deploy manual ou reativar temporariamente o deploy.

Deploy manual, quando necessario:

```bash
npx vercel --prod
```

Nao remover essa configuracao sem decisao consciente, para evitar consumo desnecessario de builds na Vercel.

## Visao oficial de permissoes

A regra principal do produto e:

```txt
Role define o padrao inicial.
Admin define a permissao real.
Permissao sempre vence o role.
```

Por padrao, cada usuario ve apenas os proprios dados financeiros.

O Admin pode liberar:

- modulos inteiros;
- funcionalidades especificas;
- acoes de ver, criar, editar e excluir;
- dados de outras pessoas;
- escopo familiar completo;
- acesso a dashboard, bancos, relatorios, investimentos, acoes e modulos futuros.

Perfis infantis ou restritos, como Caleb, sao apenas presets iniciais. Eles podem comecar vendo apenas limite proprio, gastos proprios e historico proprio, mas o Admin pode liberar qualquer modulo ou funcionalidade para eles.

## Escopos de dados

O sistema deve trabalhar com tres escopos:

```txt
own      -> apenas dados do proprio membro financeiro
selected -> pessoas especificas liberadas pelo Admin
family   -> toda a familia
```

Todas as telas, menus, consultas, server actions e regras de banco devem respeitar esse escopo.

## Dashboard

O Dashboard nao e apenas uma home visual. Ele sera a central financeira do produto.

O Dashboard deve mudar conforme o usuario:

- usuario comum: dashboard pessoal;
- usuario com permissoes selecionadas: dashboard das pessoas liberadas;
- Admin: dashboard consolidado da familia.

Blocos esperados no Dashboard final:

- visao geral do mes;
- saude financeira;
- contas fixas;
- contas a pagar;
- contas a receber;
- gastos por pessoa;
- gastos por categoria;
- bancos e saldos;
- rendas fixas e variaveis;
- investimentos;
- acoes e graficos;
- alertas;
- projecoes.

## Canais de acesso

### App Mobile / PWA Familiar

Todos os membros com login usam a experiencia mobile-first, incluindo Danyel.

O app deve permitir, conforme permissao:

- login;
- dashboard individual ou autorizado;
- lancamento rapido de gastos;
- consulta de saldo;
- consulta de contas autorizadas;
- consulta de bancos autorizados;
- consulta de rendas autorizadas;
- consulta de investimentos autorizados;
- execucao de acoes conforme permissao.

Danyel tambem usa o app como membro financeiro. Por possuir perfil Admin, o app dele exibira um atalho Admin.

### Web Admin

A web e o painel administrativo privado do Danyel.

Ela permite:

- criar membros financeiros;
- criar usuarios familiares;
- vincular usuarios a membros;
- configurar permissoes;
- configurar escopo de dados;
- liberar funcionalidades especificas;
- ajustar limites;
- gerenciar categorias;
- gerenciar bancos;
- ver relatorios consolidados;
- administrar regras da familia;
- futuramente gerenciar investimentos, acoes e alertas.

## Design e UX

O FamilyFinance deve parecer app, nao landing page.

Diretrizes:

- mobile-first;
- autenticacao simples;
- sem copy de marketing desnecessaria;
- telas limpas;
- cards arredondados;
- botoes grandes;
- poucos textos;
- acoes rapidas;
- formularios de criacao em modal/sheet quando fizer sentido;
- navegacao inferior dinamica conforme permissao;
- nenhuma rolagem lateral;
- experiencia parecida com app financeiro moderno.

## Status atual

MVP web/PWA em validacao com:

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
- Permissoes por modulo e acao;
- design mobile-first em evolucao.

## Proximas prioridades tecnicas

1. Adicionar `scope` e `allowed_member_ids` nas permissoes.
2. Criar `user_feature_permissions`.
3. Criar helpers de permissao no backend.
4. Aplicar filtros de permissao nas queries server.
5. Tornar menu dinamico por permissao.
6. Ajustar Dashboard para `own`, `selected` e `family`.
7. Evoluir Admin > Permissoes para escopo e membros liberados.
8. Criar contas fixas.
9. Criar alertas financeiros.
10. Criar investimentos.
11. Criar cotacoes, acoes e graficos.
12. Reforcar RLS no Supabase.

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
- `docs/PERMISSION_AND_DASHBOARD_STRATEGY.md`
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
SUPABASE_SERVICE_ROLE_KEY=CHAVE_SERVICE_ROLE_DO_SUPABASE
```

Tambem e aceito:

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICA_DO_SUPABASE
```

Veja todas as variaveis em:

```txt
.env.example
```

Execute as migrations no Supabase SQL Editor:

```txt
supabase/migrations/001_family_finance_schema.sql
supabase/migrations/002_dedupe_and_seed_constraints.sql
supabase/migrations/003_admin_profiles_permissions.sql
supabase/migrations/004_permission_scope_and_features.sql
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

Cada usuario ve apenas o que foi liberado.

O Admin pode liberar tudo.

O app deve ser bonito, simples, fluido, seguro, permissionado e mobile-first.
