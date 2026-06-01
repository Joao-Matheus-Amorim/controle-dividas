# Auditoria do MVP vivo

> Status DocDoc: Parcialmente superado/historico
> Superado por: direcao SaaS-first, ADRs atuais,
> `docs/VALIDACAO_TECNICA.md` e `docs/SAAS_GAP_REGISTER.md`.
> Uso atual: contexto do MVP anterior; nao usar como contrato atual de produto
> ou arquitetura.

## Objetivo

Este documento registra o estado real do MVP do FamilyFinance/Controle de Dividas antes de novas alteracoes de produto.

A regra desta fase e simples:

```txt
Nao reconstruir o que ja existe.
Auditar o projeto vivo.
Documentar o estado real.
Ajustar nomenclatura e UX.
Atacar apenas lacunas reais.
Atualizar o README conforme as decisoes forem implementadas.
```

## Decisao de produto

No MVP atual, o conceito de **Dividas** sera tratado dentro do modulo existente de **Contas a pagar**.

Isso evita criar um modulo duplicado agora e aproveita o que ja esta implementado: cadastro de contas, vencimento, responsavel, status, permissao por membro, totais, dashboard e proximos vencimentos.

### Tipos oficiais no MVP

O modulo de Contas a pagar deve evoluir para representar dois tipos:

| Tipo | Descricao | Recorrencia |
| --- | --- | --- |
| Conta avulsa | Conta/divida pontual, sem repeticao obrigatoria | Nao obrigatoria |
| Conta fixa | Conta/divida recorrente | Inicialmente mensal, futuramente personalizavel |

Exemplos de contas avulsas:

- boleto eventual;
- compra especifica;
- parcela unica;
- pagamento pontual;
- divida sem recorrencia.

Exemplos de contas fixas:

- aluguel;
- internet;
- escola;
- assinatura;
- financiamento;
- energia;
- agua.

## Estado real do MVP

### Implementado

| Area | Estado | Observacao |
| --- | --- | --- |
| Auth | Implementado | Login, cadastro, confirmacao, recuperacao, atualizacao de senha e logout |
| Protecao de rotas | Implementado | `proxy.ts` protege rotas privadas |
| Dashboard | Implementado | Mostra resumo financeiro, limite, gastos, contas, bancos, rendas e proximos vencimentos |
| Navegacao desktop | Implementado | Menu dinamico por permissao |
| Navegacao mobile | Implementado | Bottom navigation dinamica por permissao |
| Pessoas | Implementado | Cadastro, edicao basica e ativacao/desativacao de membro financeiro |
| Gastos | Implementado parcial | Criacao e exclusao existem; edicao completa ainda pendente |
| Contas a pagar | Implementado parcial | Criacao, status e exclusao existem; edicao completa e separacao fixa/avulsa ainda pendentes |
| Contas a receber | Implementado parcial | Criacao, status e exclusao existem; edicao completa ainda pendente |
| Bancos | Implementado parcial | Criacao, saldo e exclusao existem; edicao completa ainda pendente |
| Relatorios | Implementado parcial | Tela consolidada existe; filtros, graficos e exportacao ainda pendentes |
| Configuracoes | Implementado parcial | Categorias e limites existem; edicao completa e configuracoes gerais ainda pendentes |
| Admin | Implementado | Usuarios familiares e permissoes por modulo/acao/escopo |
| Testes | Implementado parcial | Ja existem testes de calculos, permissoes e dashboard queries |
| PWA | Implementado | Manifest e estrategia mobile-first |

### Planejado ou ainda nao implementado como modulo completo

| Area | Estado | Decisao atual |
| --- | --- | --- |
| Dividas | Planejado como modulo, mas no MVP sera absorvido por Contas a pagar | Nao criar modulo separado agora |
| Contas fixas | Planejado | Implementar como evolucao de Contas a pagar |
| Metas | Futuro | Fora do escopo imediato |
| Investimentos | Futuro | Fora do escopo imediato |
| Acoes/cotacoes | Futuro | Fora do escopo imediato |
| Alertas financeiros | Futuro | Fora do escopo imediato |
| Graficos avancados | Futuro | Fora do escopo imediato |

## Rotas publicas/auth

| Rota | Estado | Observacao |
| --- | --- | --- |
| `/` | Existe | Entrada/publica |
| `/auth/login` | Existe | Login |
| `/auth/sign-up` | Existe | Cadastro com email autorizado |
| `/auth/sign-up-success` | Existe | Sucesso de cadastro |
| `/auth/forgot-password` | Existe | Recuperacao de senha |
| `/auth/update-password` | Existe | Atualizacao de senha |
| `/auth/error` | Existe | Erro de auth |
| `/auth/confirm` | Existe | Confirmacao de auth |

## Rotas protegidas

| Rota | Estado | Modulo |
| --- | --- | --- |
| `/protected` | Existe | Dashboard |
| `/protected/pessoas` | Existe | Pessoas |
| `/protected/gastos` | Existe | Gastos |
| `/protected/contas-a-pagar` | Existe | Contas a pagar / Dividas no MVP |
| `/protected/contas-a-receber` | Existe | Contas a receber |
| `/protected/bancos` | Existe | Bancos |
| `/protected/relatorios` | Existe | Relatorios |
| `/protected/configuracoes` | Existe | Configuracoes |
| `/protected/admin` | Existe | Admin |
| `/protected/admin/usuarios` | Existe | Usuarios familiares |
| `/protected/admin/permissoes` | Existe | Permissoes |

## Fluxo real de usuario

### Usuario deslogado

```txt
Abre o app
  -> acessa rota publica ou auth
  -> tenta acessar area privada
  -> proxy valida sessao
  -> sem sessao, redireciona para /auth/login
```

### Cadastro

```txt
Admin cadastra/libera email familiar
  -> usuario acessa /auth/sign-up
  -> informa email e senha
  -> sistema valida se email existe em profiles
  -> Supabase cria auth user
  -> usuario confirma acesso
  -> sistema vincula auth.users ao profile familiar
```

### Usuario logado

```txt
Login aprovado
  -> redireciona para /protected
  -> layout carrega modulos visiveis
  -> menu desktop/mobile mostra apenas o que o perfil pode acessar
  -> dashboard mostra apenas dados dentro do escopo permitido
```

## Fluxo atual de Contas a pagar / Dividas

### O que ja existe

- Criacao de conta a pagar;
- nome da conta;
- categoria;
- valor;
- data de vencimento;
- responsavel;
- status;
- banco utilizado;
- recorrencia textual;
- observacao;
- validacao de campos obrigatorios;
- permissao de criacao por membro;
- listagem;
- total pendente;
- total atrasado;
- total pago;
- status visual;
- alteracao de status;
- exclusao;
- reflexo no dashboard.

### Lacunas reais

- Diferenciar oficialmente conta fixa e conta avulsa;
- melhorar nomenclatura para o usuario entender que isso cobre dividas;
- definir se a diferenciacao sera feita por campo novo ou pela recorrencia existente;
- avaliar necessidade de migration;
- criar filtros por tipo e status;
- finalizar edicao completa de conta;
- melhorar feedback de erro em actions que hoje podem falhar silenciosamente.

## Fluxo atual do Dashboard

### O que ja existe

- Carrega modulos visiveis;
- respeita permissoes;
- carrega gastos;
- carrega contas a pagar;
- carrega contas a receber;
- carrega bancos;
- mostra acoes rapidas;
- mostra resumo financeiro;
- mostra uso de limite;
- mostra proximos vencimentos;
- mostra categorias;
- mostra bancos;
- mostra rendas;
- mostra aviso de dashboard limitado por permissao.

### Lacunas reais

- Periodo dinamico ainda precisa evoluir;
- nomenclatura deve acompanhar a decisao `Contas a pagar = Dividas no MVP`;
- quando fixa/avulsa existir, avaliar se o dashboard deve separar esses totais;
- revisar estados vazios para todos os blocos.

## Fluxo atual de testes

### O que ja existe

- Testes unitarios de calculos financeiros;
- testes de formatacao de moeda;
- testes de limite restante;
- testes de percentual usado;
- testes de permissoes/RBAC;
- testes de escopo `own`, `selected` e `family`;
- testes de admin bypass;
- testes de perfil inativo;
- testes de permissoes por funcionalidade;
- testes de integracao de dashboard queries com MSW;
- teste de falha controlada de query.

### Lacunas reais

- Testes especificos para auth/cadastro autorizado;
- testes especificos para criacao de conta a pagar;
- testes especificos para status de conta a pagar;
- testes especificos para conta fixa versus avulsa quando implementado;
- testes de feedback de erro/sucesso em actions criticas quando viavel.

## Proximas Issues apos esta auditoria

| Issue | Novo foco |
| --- | --- |
| #6 | Auditar auth ja implementado |
| #7 | Refinar criacao de Contas a pagar como Dividas |
| #8 | Refinar listagem/status/UX de Contas a pagar como Dividas |
| #9 | Refinar dashboard vivo com nomenclatura de dividas |
| #10 | Padronizar loading, vazio e erro reaproveitando componentes existentes |
| #11 | Expandir testes apenas onde ha lacunas reais |

## Decisoes registradas

1. O MVP nao tera modulo separado de Dividas neste momento.
2. Contas a pagar sera o nucleo de Dividas no MVP.
3. Contas a pagar tera dois tipos: fixa e avulsa.
4. Conta fixa nasce mensal e depois podera ter recorrencia personalizada.
5. O projeto deve reaproveitar o que ja existe.
6. O README deve ser atualizado conforme cada decisao for implementada no codigo.

## Criterio para fechar a Issue #5

A Issue #5 pode ser fechada quando:

- este documento estiver mergeado na `main`;
- o README apontar para esta auditoria;
- as Issues #6 a #11 estiverem alinhadas com o projeto vivo;
- o time aceitar a decisao de produto sobre Contas a pagar/Dividas.
