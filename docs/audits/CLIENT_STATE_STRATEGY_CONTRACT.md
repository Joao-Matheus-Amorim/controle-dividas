# Client State Strategy Contract

> Status DocDoc: Atual
> Uso atual: contrato vigente do GAP-019 para escolher estado local,
> URL state, Server Actions, tabela TanStack e futuras stores sem falso verde.
> Atualizado em: 2026-06-08.

## Objetivo

Este contrato reduz o GAP-019 antes de o app crescer em filtros,
paginacao, updates otimistas e coordenacao local de UI.

Ele define quando usar:

- estado local React;
- `searchParams`/URL state;
- `useActionState`;
- `useTransition`;
- `@tanstack/react-table`;
- server data e Server Actions;
- uma store global futura.

Este documento nao implementa runtime novo. Ele cria o contrato para impedir
decisoes ad hoc quando novas telas ou filtros forem adicionados.

## Estado atual por inspecao

O codigo atual ja usa os seguintes padroes:

- estado local simples em auth forms (`components/login-form.tsx`,
  `components/sign-up-form.tsx`, `components/forgot-password-form.tsx` e
  `components/update-password-form.tsx`);
- `useActionState` para formularios com Server Actions em componentes
  financeiros, admin, onboarding, bancos, pessoas e configuracoes;
- `useTransition` para a superficie client-side de exclusao em
  `components/finance/expense-list-client.tsx`;
- `searchParams` em paginas protegidas com filtros ou feedback de rota;
- `@tanstack/react-table` em `components/app/app-data-table.tsx`;
- dados financeiros e tenant scope resolvidos server-side antes de renderizar
  a UI protegida.

Nao ha store global versionada como Zustand, Jotai, Redux, SWR ou React Query.

## Regras de decisao

### 1. Server data primeiro

Dados financeiros, permissoes, organizacao ativa e informacoes tenant-scoped
devem ser buscados no servidor.

Use Server Components, helpers server-side e Server Actions quando o estado
depende de:

- usuario autenticado;
- organizacao ativa;
- membership;
- RLS;
- permissao por modulo ou feature;
- dados financeiros persistidos.

Client state nao deve virar fonte de verdade para autorizacao ou isolamento.

### 2. `useActionState` para formularios que mutam dados

Use `useActionState` quando uma UI submete uma Server Action e precisa de:

- mensagem de sucesso ou erro;
- estado pending;
- resultado tipado de validacao;
- integracao com forms HTML;
- feedback apos create, update, delete ou status transition.

Esse padrao deve continuar sendo o default para formularios financeiros,
admin, pessoas, configuracoes, onboarding e billing actions.

### 3. Estado local para UI efemera

Use `useState` local apenas para estado que nao precisa sobreviver a reload,
link compartilhavel ou navegacao:

- modal aberto/fechado;
- sheet aberto/fechado;
- item em edicao;
- item em exclusao;
- checkbox de confirmacao;
- campos de formulario antes do submit;
- erro local de validacao client-side;
- feedback visual imediato sem persistencia.

Estado local nao deve carregar filtros de lista que precisam ser
compartilhados por URL ou reproduzidos em server render.

### 4. URL state para filtros, busca e pagina

Use `searchParams` quando o estado precisa ser:

- compartilhavel por link;
- preservado em reload;
- legivel pelo servidor;
- compativel com `/protected/*` e `/org/[orgSlug]/*`;
- usado para filtros, busca, ordenacao ou pagina.

Ao adicionar filtro novo em modulo protegido, preserve o helper de rota
organization-aware quando a pagina tambem existir em `/org/[orgSlug]`.

### 5. `@tanstack/react-table` para tabela rica

Use `@tanstack/react-table` quando a superficie realmente precisa de:

- ordenacao por coluna;
- filtro global;
- paginacao ou composicao de colunas;
- tabela reutilizavel com schema claro.

Nao use tabela rica para listas mobile simples onde cards de dominio sao mais
claros.

### 6. `useTransition` para acoes client-side com espera curta

Use `useTransition` quando a UI client-side precisa disparar uma acao sem
bloquear interacao local e sem perder contexto visual.

O uso deve continuar acompanhado de Server Action ou boundary server-side.
`useTransition` nao substitui autorizacao, rate limit, audit logging ou
validacao de permissao.

### 7. Store global futura exige ADR ou contrato

Nao introduzir Zustand, Jotai, Redux, SWR ou React Query sem PR dedicado.

Uma store global so deve existir se houver necessidade real de coordenar
estado entre superficies que nao podem ser resolvidas por server data,
`searchParams`, props ou estado local.

Antes de adicionar store global, o PR deve documentar:

- dominio do estado;
- porque server data, URL state e local state nao bastam;
- regra de invalidadacao;
- impacto em multi-tenant e troca de organizacao ativa;
- rollback.

## Contrato por superficie

| Superficie | Estado recomendado | Observacao |
| --- | --- | --- |
| Auth forms | `useState` local + Server Action/API boundary | Sem audit runtime quando nao ha membership. |
| Onboarding organizacao | `useActionState` | Rate limit server-side ja existe. |
| Formularios financeiros | `useActionState` | Permissao e tenant scope no servidor. |
| Listas financeiras simples | Server data + props + estado local para modais | Filtros novos devem preferir URL state. |
| Contas a pagar com filtros | `searchParams`/URL state | Estado vazio por filtro deve ser preservado. |
| Relatorios | `searchParams`/URL state | Filtros por periodo devem ser compartilhaveis. |
| App data table | `@tanstack/react-table` | Usar para tabela rica, nao para todo card mobile. |
| Organizacao ativa | Server context + action persistente | Nao duplicar em store client-side. |

## Fora de escopo

Este contrato nao:

- adiciona dependencias;
- altera runtime;
- altera schema, RLS, billing ou deploy;
- implementa store global;
- implementa filtros novos;
- altera UI visual;
- remove `owner_id`.

## Proxima expansao segura

1. Ao adicionar filtros em gastos, contas a receber, bancos ou relatorios,
   usar URL state primeiro.
2. Ao adicionar paginacao, decidir se sera server-side ou TanStack local antes
   de codar.
3. Ao propor updates otimistas, documentar rollback visual e reconciliacao com
   Server Actions.
4. Se surgir necessidade de store global, abrir ADR/contrato proprio antes da
   dependencia.

## Acceptance

Um PR futuro que altera estado client-side deve:

- citar este contrato quando adicionar filtros, paginacao, estado otimista ou
  store;
- manter dados tenant-scoped e permissoes como server data;
- manter URL state para filtros compartilhaveis;
- manter `useActionState` para forms com Server Actions;
- justificar qualquer nova dependencia de estado;
- atualizar `docs/SAAS_GAP_REGISTER.md` se reduzir GAP-019.
