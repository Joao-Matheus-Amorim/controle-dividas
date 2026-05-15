# FamilyFinance - Estrategia de Testes

Este documento define a estrategia de testes do FamilyFinance: o que deve ser testado, cobertura minima exigida por modulo, como rodar os testes localmente e quais criterios precisam ser cumpridos antes de considerar uma entrega pronta.

Ele complementa:

- `docs/VALIDACAO_TECNICA.md`;
- `docs/ARCHITECTURE.md`;
- `docs/pm/04_REQUISITOS.md`;
- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`;
- `docs/pm/06_ACEITE_ROADMAP.md`.

## Objetivo

Garantir que o FamilyFinance continue seguro, funcional e coerente com as permissoes familiares conforme o projeto evolui.

O foco principal dos testes e proteger:

- calculos financeiros;
- autenticacao e vinculo de usuario familiar;
- regras de permissao;
- escopos `own`, `selected` e `family`;
- queries do Dashboard;
- mutacoes financeiras;
- integridade dos mocks/fixtures;
- comportamento dos modulos principais.

## Stack de testes atual

O projeto usa:

- Vitest;
- Testing Library;
- jsdom;
- MSW;
- fixtures locais;
- mocks de Supabase REST.

Arquivos de configuracao:

```txt
vitest.config.ts
vitest.setup.ts
```

Scripts disponiveis:

```bash
npm run test
npm run test:run
npm run test:watch
```

Comandos de qualidade relacionados:

```bash
npm run lint
npm run build
npm run test:run
```

## Estrutura atual de testes

```txt
__tests__/
├─ fixtures/
│  ├─ mock-data.ts
│  ├─ msw-finance-data.ts
│  └─ msw-handlers.ts
│
├─ integration/
│  ├─ dashboard-queries.test.ts
│  └─ permissions-flow.test.ts
│
└─ unit/
   ├─ access-control.test.ts
   ├─ calculations.test.ts
   └─ mock-data.test.ts
```

## Testes existentes

### Unitarios

```txt
__tests__/unit/access-control.test.ts
```

Cobre:

- `getAccessibleMemberIds`;
- escopo `own`;
- escopo `selected`;
- escopo `family`;
- permissoes por acao;
- Admin bypass;
- perfil inativo;
- `assertCanAccessMember`;
- `canUseFeature`;
- `FEATURE_PERMISSIONS`.

```txt
__tests__/unit/calculations.test.ts
```

Cobre:

- `formatCurrency`;
- `compactCurrency`;
- `calculateRemainingLimit`;
- `calculateUsedPercent`;
- lookups de membro/categoria;
- totais financeiros baseados em fixtures;
- resumos por membro;
- resumos por categoria;
- ordenacao de proximas contas;
- resumo do Dashboard baseado em fixtures.

```txt
__tests__/unit/mock-data.test.ts
```

Cobre:

- integridade basica dos dados mockados;
- consistencia minima das fixtures.

### Integracao

```txt
__tests__/integration/dashboard-queries.test.ts
```

Cobre:

- chamadas simuladas ao Supabase REST via MSW;
- carregamento dos grupos do Dashboard;
- `family_members`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`;
- calculo de totais simulados;
- falha controlada quando uma query retorna erro.

```txt
__tests__/integration/permissions-flow.test.ts
```

Cobre:

- usuario com escopo `own` vendo apenas o proprio gasto;
- usuario com escopo `selected` vendo apenas membros liberados;
- Admin vendo todos os gastos;
- simulacao de permissao por profile/modulo;
- filtros `family_member_id=in.(...)` via MSW.

## Cobertura minima exigida por tipo de mudanca

### Mudanca visual simples

Exemplos:

- texto;
- cor;
- espacamento;
- icone;
- ajuste de layout;
- copy de botao.

Obrigatorio:

```bash
npm run lint
npm run build
```

Teste manual:

- abrir a tela alterada;
- validar responsividade mobile;
- validar que nao surgiu rolagem horizontal;
- validar que botoes e formularios continuam acessiveis.

Teste automatizado novo:

- opcional, salvo se a alteracao mudar comportamento.

### Mudanca de regra de negocio

Exemplos:

- calculo financeiro;
- status de conta;
- regra de atraso;
- saldo projetado;
- limite mensal;
- totalizador;
- relatorio.

Obrigatorio:

```bash
npm run lint
npm run build
npm run test:run
```

Teste automatizado minimo:

- teste unitario para funcao pura;
- teste de integracao se depender de multiplas tabelas;
- teste de regressao se alterar comportamento existente.

### Mudanca em permissao

Exemplos:

- `getAccessibleMemberIds`;
- `getVisibleModuleKeys`;
- `assertCanAccessMember`;
- `canUseFeature`;
- `user_module_permissions`;
- `user_feature_permissions`;
- Admin guard;
- menu dinamico.

Obrigatorio:

```bash
npm run lint
npm run build
npm run test:run
```

Teste automatizado minimo:

- unitario para helper de permissao;
- caso `own`;
- caso `selected`;
- caso `family`;
- caso Admin;
- caso perfil inativo;
- caso acao negada;
- caso acao permitida.

Teste manual:

- logar como Admin;
- criar/editar permissoes;
- logar como usuario comum;
- validar menu;
- validar dados visiveis;
- validar mutacao permitida;
- validar mutacao bloqueada.

### Mudanca em Server Action

Exemplos:

- criar gasto;
- excluir gasto;
- alterar status de conta;
- criar banco;
- atualizar saldo;
- criar usuario familiar;
- salvar permissoes.

Obrigatorio:

```bash
npm run lint
npm run build
npm run test:run
```

Teste automatizado recomendado:

- mock do Supabase client;
- caso de input invalido;
- caso de permissao negada;
- caso de sucesso;
- caso de erro Supabase;
- verificar `revalidatePath` quando aplicavel.

Teste manual obrigatorio:

- executar a action pela UI;
- conferir persistencia no Supabase;
- conferir atualizacao do Dashboard/Relatorios;
- conferir comportamento com usuario sem permissao.

### Mudanca em banco/migration

Exemplos:

- nova tabela;
- nova coluna;
- nova constraint;
- nova policy RLS;
- alteracao em `profiles`;
- alteracao em permissoes.

Obrigatorio:

```bash
npm run lint
npm run build
npm run test:run
```

Validacao manual obrigatoria:

- aplicar migration em ambiente local/dev;
- confirmar tabelas/colunas no Supabase;
- testar insert/update/select afetados;
- testar usuario Admin;
- testar usuario comum;
- testar usuario sem permissao.

Documento a atualizar:

- `README.md`;
- `docs/ARCHITECTURE.md`;
- `docs/VALIDACAO_TECNICA.md`;
- `docs/pm/04_REQUISITOS.md`, se for requisito novo.

## Cobertura minima por modulo

### Autenticacao

Deve testar:

- login com credenciais validas;
- erro de login;
- cadastro com e-mail autorizado;
- bloqueio de cadastro com e-mail nao autorizado;
- confirmacao de e-mail/token;
- vinculo `auth.users` -> `profiles`;
- usuario inativo bloqueado;
- usuario sem sessao redirecionado.

Estado atual:

- parte do fluxo esta coberta por inspecao/manual;
- ainda faltam testes automatizados especificos para auth actions/confirm route.

Prioridade:

```txt
Alta
```

### Proxy de sessao

Deve testar:

- rota publica nao bloqueada;
- asset estatico ignorado;
- rota protegida sem sessao redireciona;
- rota protegida com claims segue;
- cookies sao sincronizados corretamente.

Estado atual:

- implementado;
- ainda sem teste automatizado dedicado.

Prioridade:

```txt
Media
```

### Access Control / RBAC

Deve testar:

- Admin ve tudo;
- usuario inativo nao ve nada;
- `own` retorna apenas membro vinculado;
- `selected` retorna `allowed_member_ids`;
- `family` retorna membros ativos;
- `can_view` libera visualizacao;
- `can_create` libera criacao;
- `can_edit` libera edicao/status;
- `can_delete` libera exclusao;
- `assertCanAccessMember` bloqueia membro fora do escopo;
- `canUseFeature` respeita feature permissions.

Estado atual:

- coberto por `__tests__/unit/access-control.test.ts`.

Prioridade:

```txt
Alta e permanente
```

### Dashboard

Deve testar:

- carregamento de membros;
- carregamento de gastos;
- carregamento de contas a pagar;
- carregamento de contas a receber;
- carregamento de bancos;
- calculo de totais;
- falha controlada de query;
- filtragem por escopo;
- blocos visiveis conforme modulo permitido.

Estado atual:

- parte coberta por `dashboard-queries.test.ts`;
- precisa evoluir para testar blocos/visibilidade da UI.

Prioridade:

```txt
Alta
```

### Pessoas

Deve testar:

- criar membro;
- editar membro;
- ativar/desativar membro;
- atualizar limite;
- impedir dados invalidos;
- refletir mudanca no Dashboard.

Estado atual:

- validacao manual/documentada;
- faltam testes automatizados de Server Actions.

Prioridade:

```txt
Media
```

### Gastos

Deve testar:

- criar gasto valido;
- rejeitar gasto sem pessoa;
- rejeitar gasto sem data;
- rejeitar gasto sem descricao;
- rejeitar valor invalido;
- bloquear criacao para membro fora do escopo;
- excluir gasto com `can_delete`;
- bloquear exclusao sem `can_delete`;
- recalcular total de gastos;
- recalcular limite restante;
- aparecer por categoria.

Estado atual:

- fluxo de permissao geral coberto;
- faltam testes automatizados da action `createExpense`/`deleteExpense`.

Prioridade:

```txt
Alta
```

### Contas a pagar

Deve testar:

- criar conta valida;
- rejeitar sem responsavel;
- rejeitar sem nome;
- rejeitar valor invalido;
- rejeitar sem vencimento;
- rejeitar status invalido;
- bloquear criacao fora do escopo;
- alterar status com `can_edit`;
- bloquear alteracao sem `can_edit`;
- excluir com `can_delete`;
- bloquear exclusao sem `can_delete`;
- conta vencida vira `atrasado` calculado.

Estado atual:

- validacao manual/documentada;
- faltam testes automatizados de Server Actions.

Prioridade:

```txt
Alta
```

### Contas a receber

Deve testar:

- criar recebimento valido;
- rejeitar sem recebedor;
- rejeitar sem origem;
- rejeitar tipo invalido;
- rejeitar valor invalido;
- rejeitar sem data prevista;
- rejeitar status invalido;
- bloquear criacao fora do escopo;
- alterar status com `can_edit`;
- excluir com `can_delete`;
- vencido nao recebido vira `atrasado` calculado.

Estado atual:

- validacao manual/documentada;
- faltam testes automatizados de Server Actions.

Prioridade:

```txt
Alta
```

### Bancos

Deve testar:

- criar banco valido;
- rejeitar sem membro;
- rejeitar sem nome do banco;
- rejeitar saldo invalido;
- bloquear criacao fora do escopo;
- atualizar saldo com `can_edit`;
- bloquear atualizacao sem `can_edit`;
- excluir com `can_delete`;
- somar saldo total por escopo;
- agrupar bancos por membro.

Estado atual:

- validacao manual/documentada;
- faltam testes automatizados de Server Actions.

Prioridade:

```txt
Media/Alta
```

### Relatorios

Deve testar:

- total de limite mensal;
- total de gastos;
- total de contas pendentes;
- total de rendas recebidas;
- total de rendas previstas;
- total de bancos;
- saldo final projetado;
- gastos por pessoa;
- gastos por categoria;
- listas de pendentes/recebidos;
- respeito ao escopo permitido.

Estado atual:

- logica server existe;
- faltam testes automatizados especificos para `getReportsDashboardData`.

Prioridade:

```txt
Media/Alta
```

### Configuracoes

Deve testar:

- criar categoria;
- rejeitar categoria sem nome;
- excluir categoria;
- atualizar limite mensal;
- rejeitar limite invalido;
- revalidar paginas afetadas.

Estado atual:

- validacao manual/documentada;
- faltam testes automatizados de Server Actions.

Prioridade:

```txt
Media
```

### Admin e usuarios familiares

Deve testar:

- garantir Admin por `ADMIN_EMAIL`;
- bloquear nao Admin;
- criar usuario familiar;
- rejeitar e-mail duplicado;
- rejeitar membro ja vinculado;
- rejeitar membro de outro owner;
- editar usuario familiar;
- bloquear edicao de Admin indevida;
- ativar/desativar usuario;
- excluir usuario comum;
- impedir excluir Admin;
- sincronizar Auth user por e-mail;
- criar permissoes default por modelo de acesso.

Estado atual:

- implementado;
- faltam testes automatizados dedicados de Admin actions.

Prioridade:

```txt
Alta
```

### Permissoes Admin

Deve testar:

- salvar permissoes por modulo;
- salvar `can_view`;
- salvar `can_create`;
- salvar `can_edit`;
- salvar `can_delete`;
- salvar `scope`;
- salvar `allowed_member_ids` quando scope for `selected`;
- limpar `allowed_member_ids` quando scope nao for `selected`;
- revalidar telas Admin;
- refletir permissoes no menu e queries.

Estado atual:

- helpers cobertos;
- fluxo de permissao com MSW coberto parcialmente;
- action `saveProfilePermissions` ainda precisa de teste especifico.

Prioridade:

```txt
Alta
```

## Padrao recomendado para novos testes

### Teste unitario

Usar quando:

- funcao pura;
- helper de permissao;
- calculo financeiro;
- transformacao de dados;
- formatacao;
- regra isolada.

Estrutura recomendada:

```txt
__tests__/unit/<nome>.test.ts
```

### Teste de integracao

Usar quando:

- fluxo depende de mais de uma tabela;
- simula Supabase REST;
- envolve permissoes + dados;
- envolve Dashboard/Relatorios;
- precisa testar comportamento com MSW.

Estrutura recomendada:

```txt
__tests__/integration/<fluxo>.test.ts
```

### Teste de Server Action

Usar quando:

- action valida FormData;
- action usa Supabase;
- action usa `assertCanAccessMember`;
- action chama `revalidatePath`;
- action retorna erro/sucesso.

Estrutura recomendada:

```txt
__tests__/unit/<modulo>-actions.test.ts
```

## Padrao de nome

Recomendado:

```txt
<modulo>.test.ts
<modulo>-actions.test.ts
<modulo>-queries.test.ts
<fluxo>-flow.test.ts
```

Exemplos:

```txt
access-control.test.ts
calculations.test.ts
expenses-actions.test.ts
payable-bills-actions.test.ts
reports-server.test.ts
permissions-flow.test.ts
```

## Como rodar localmente

### Rodar todos os testes uma vez

```bash
npm run test:run
```

### Rodar em modo watch

```bash
npm run test:watch
```

### Rodar Vitest interativo

```bash
npm run test
```

### Rodar validacao completa antes de commit/release

```bash
npm run lint
npm run build
npm run test:run
```

## Checklist antes de abrir commit relevante

- [ ] Rodei `npm run lint`.
- [ ] Rodei `npm run build`.
- [ ] Rodei `npm run test:run`.
- [ ] Se alterei permissao, cobri `own`, `selected`, `family` e Admin.
- [ ] Se alterei Server Action, testei sucesso, erro de input e erro de permissao.
- [ ] Se alterei migration, testei no Supabase dev/local.
- [ ] Se alterei Dashboard/Relatorios, validei totais.
- [ ] Se alterei UI, validei mobile.
- [ ] Se alterei regra, atualizei README/docs.

## Criterio minimo por release

Nenhuma release manual deve ser considerada pronta sem:

```bash
npm run lint
npm run build
npm run test:run
```

E sem validacao manual de:

- login;
- Admin;
- permissoes;
- Dashboard;
- Gastos;
- Contas a pagar;
- Contas a receber;
- Bancos;
- Relatorios.

## Lacunas atuais de testes

Prioridade alta:

- testes de `createExpense` e `deleteExpense`;
- testes de `createPayableBill`, `updatePayableBillStatus` e `deletePayableBill`;
- testes de `createReceivableIncome`, `updateReceivableIncomeStatus` e `deleteReceivableIncome`;
- testes de `createFamilyUser`, `updateFamilyUser`, `syncFamilyUserAuthLink` e `saveProfilePermissions`;
- testes de auth confirm/linking.

Prioridade media:

- testes de `createBankAccount`, `updateBankAccountBalance` e `deleteBankAccount`;
- testes de `createExpenseCategory`, `deleteExpenseCategory` e `updateFamilyMemberLimit`;
- testes de `getReportsDashboardData`;
- testes do proxy de sessao.

Prioridade futura:

- testes E2E;
- testes de acessibilidade;
- testes de performance;
- testes de exportacao;
- testes de app mobile nativo quando existir.

## Regra final

```txt
Toda regra financeira importante precisa de teste.
Toda permissao sensivel precisa de teste.
Toda Server Action que muda dado financeiro precisa validar permissao e deve ganhar teste.
Todo bug corrigido deve virar teste de regressao quando possivel.
```