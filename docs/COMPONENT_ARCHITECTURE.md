# Arquitetura de Componentes

Este documento registra o estado atual da componentizacao das telas protegidas do FamilyFinance.

## Padrao adotado

```txt
app/protected/**/page.tsx -> orquestracao server-side
components/<dominio>     -> secoes visuais da tela
components/finance       -> formularios e dialogs compartilhados
components/ui            -> primitives de UI
lib/finance              -> dados, permissoes, calculos e server helpers
```

As paginas devem carregar dados, calcular totais simples, ler permissoes e compor componentes. A UI de cada modulo fica em componentes por dominio.

## Diretorios por dominio

```txt
components/dashboard
components/payables
components/expenses
components/receivables
components/banks
components/reports
components/settings
components/people
components/admin
components/admin/users
components/admin/permissions
```

## Paginas ja componentizadas

```txt
app/protected/page.tsx
app/protected/pessoas/page.tsx
app/protected/gastos/page.tsx
app/protected/contas-a-pagar/page.tsx
app/protected/contas-a-receber/page.tsx
app/protected/bancos/page.tsx
app/protected/relatorios/page.tsx
app/protected/configuracoes/page.tsx
app/protected/admin/page.tsx
app/protected/admin/usuarios/page.tsx
app/protected/admin/permissoes/page.tsx
```

## Responsabilidades principais

### Dashboard

```txt
components/dashboard
```

Contem header, hero, acoes rapidas, resumo financeiro, dividas, familia, vencimentos, categorias, bancos e rendas.

### Contas a pagar / Dividas

```txt
components/payables
```

Contem header, hero, cards, criacao, filtros, lista e item da lista.

### Gastos

```txt
components/expenses
```

Contem header, hero, cards, criacao, impacto por pessoa, categorias e lista.

### Contas a receber

```txt
components/receivables
```

Contem header, hero, cards, criacao, lista e item da lista.

### Bancos

```txt
components/banks
```

Contem header, hero, cards, criacao, saldo por pessoa, lista e item da lista.

### Relatorios

```txt
components/reports
```

Contem header, hero, cards, gastos por pessoa, categorias, contas pendentes e rendas recebidas.

### Configuracoes

```txt
components/settings
```

Contem header, hero, cards, limites mensais, categorias e regras automaticas.

### Pessoas

```txt
components/people
```

Contem header, hero, cards, criacao, lista e item da lista com edicao/ativacao.

### Admin

```txt
components/admin
components/admin/users
components/admin/permissions
```

Contem a tela principal do Admin, usuarios familiares e permissoes por modulo.

## Componentes compartilhados

```txt
components/finance
components/app
components/ui
```

`components/finance` continua concentrando formularios e dialogs compartilhados por modulos financeiros.

`components/app` concentra componentes internos genericos.

`components/ui` concentra primitives de UI estilo shadcn/Radix.

## Seed inicial

Os defaults usados pelo seed inicial ficam em:

```txt
lib/finance/default-seed-data.ts
```

Assim o codigo de producao nao depende de fixtures de teste para criar dados iniciais.

## Cuidados para novas PRs

- PR de componentizacao nao deve alterar regra de negocio.
- PR de UI nao deve alterar migrations.
- PR de dependencias deve atualizar `package.json` e `package-lock.json` juntos.
- Componentes que recebem constantes readonly devem aceitar tipos readonly.
- Validar sempre com `npm run lint`, `npm run build` e `npm run test`.
