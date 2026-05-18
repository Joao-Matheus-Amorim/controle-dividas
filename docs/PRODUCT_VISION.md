# FamilyFinance - Visao do Produto

## Definicao

FamilyFinance e um SaaS financeiro multi-tenant, mobile-first, seguro e preparado para producao massiva.

A direcao vigente do produto nao e mais uma solucao familiar privada, single-tenant ou personalizada para uma unica familia. A origem familiar do projeto permanece apenas como contexto historico e validacao inicial de dominio, mas nao deve mais guiar roadmap, arquitetura, documentacao, seguranca ou decisoes de escopo.

A decisao estrategica esta registrada em:

- `docs/adr/0001-saas-first-production-positioning.md`

A partir desta decisao, o produto deve ser conduzido como uma plataforma capaz de atender varias familias, grupos financeiros ou organizacoes independentes, cada uma com dados isolados, membros proprios, permissoes proprias, dashboard proprio, onboarding proprio e possibilidade futura de planos comerciais.

## Decisao de fase

### Fase historica encerrada

```txt
FamilyFinance como solucao familiar privada, single-tenant e personalizada.
```

Essa fase foi importante para validar dominio, UX inicial, regras financeiras e base tecnica, incluindo:

- autenticacao;
- dashboard financeiro;
- membros financeiros;
- gastos;
- contas a pagar;
- contas a receber;
- bancos;
- relatorios;
- configuracoes;
- Admin familiar;
- usuarios familiares;
- permissoes por modulo;
- permissoes por acao;
- escopos de dados;
- PWA/mobile-first;
- testes e documentacao.

Essa fase esta encerrada como direcao de produto.

### Fase vigente

```txt
FamilyFinance como SaaS financeiro multi-tenant para producao massiva.
```

A nova fase deve ser implementada de forma incremental, sem SQL destrutivo, sem reescrita da stack, sem billing prematuro e sem misturar rotas, RLS, visual e cobranca em uma unica mudanca.

## Produto alvo

O produto alvo passa a ser uma plataforma SaaS/PWA mobile-first com:

- multiplas organizacoes/familias;
- isolamento de dados por organizacao;
- usuarios vinculados a uma ou mais organizacoes;
- permissoes por organizacao;
- dashboard contextual por organizacao e por usuario;
- modulos financeiros familiares;
- painel Admin por organizacao;
- possibilidade futura de app nativo Android/iOS;
- possibilidade futura de assinatura e planos comerciais;
- seguranca baseada em RLS, memberships e validacao server-side;
- governanca documental por issues, PRs pequenos, gates, ADRs e documentos PMBOK no que compete ao projeto.

## Visao central

O FamilyFinance nao e apenas um controle de gastos. Ele deve evoluir para uma central financeira familiar SaaS, multi-tenant e comercialmente operavel com:

- dashboard contextual;
- contas fixas;
- contas a pagar;
- contas a receber;
- bancos;
- rendas fixas e variaveis;
- gastos por pessoa;
- categorias;
- permissoes dinamicas;
- relatorios;
- graficos;
- alertas;
- notificacoes;
- investimentos futuros;
- acoes/cotacoes futuras;
- billing futuro;
- isolamento completo por organizacao;
- auditoria operacional futura.

Cada usuario deve ver apenas o que sua organizacao e suas permissoes liberarem.

## Regra de permissao do produto

A regra oficial permanece valida, mas agora precisa ser aplicada dentro de uma organizacao:

```txt
Role define o padrao inicial.
Admin define a permissao real.
Permissao sempre vence o role.
Tudo isso acontece dentro de uma organizacao.
```

Isso significa que usuarios comuns veem apenas seus proprios dados por padrao, mas o Admin da organizacao pode liberar modulos, funcionalidades, acoes e dados de outras pessoas dentro daquela organizacao.

No modelo SaaS, um mesmo usuario podera futuramente participar de mais de uma organizacao com papeis diferentes. Exemplo: admin em uma organizacao e membro comum em outra.

## Organizacao como unidade de negocio

A unidade principal do SaaS sera a organizacao.

A organizacao representa:

- uma familia;
- um casal;
- um grupo financeiro;
- uma conta contratante;
- um workspace de controle financeiro familiar.

A nomenclatura recomendada para o banco e documentacao tecnica e:

```txt
organizations
organization_memberships
organization_id
organization_slug
```

A palavra tenant continua sendo o conceito tecnico, mas a linguagem de produto deve favorecer `organization` para manter flexibilidade comercial.

## Papel do painel web/PWA

O painel web em Next.js continua importante e sera usado como:

- PWA principal no curto prazo;
- backoffice administrativo da organizacao;
- ambiente de validacao das regras financeiras;
- painel do Admin da organizacao;
- referencia funcional para app mobile futuro;
- ferramenta de suporte e configuracao;
- laboratorio do Dashboard completo;
- base para evolucao SaaS.

A web/PWA nao deve ser abandonada. Ela sera a primeira versao funcional do SaaS.

## Papel do app nativo

O app nativo Android/iOS continua sendo uma fase futura.

Ele deve priorizar:

- experiencia de app;
- login persistente;
- selecao ou resolucao de organizacao ativa;
- dashboard conforme permissao;
- lancamento rapido de gastos;
- consulta de saldo individual;
- notificacoes de vencimento;
- visualizacao de contas autorizadas;
- visualizacao de bancos autorizados;
- navegacao simples por permissoes.

Antes do app nativo, a base SaaS Web/PWA precisa estar consolidada.

## Admin da organizacao

O Admin da organizacao permanece como pilar central do sistema.

Ele podera, dentro da propria organizacao:

- ver tudo da organizacao;
- criar usuarios/membros;
- vincular usuarios a membros financeiros;
- definir limites;
- gerenciar categorias;
- gerenciar bancos;
- definir permissoes por modulo;
- definir permissoes de ver, criar, editar e excluir;
- definir escopo de dados: proprio, selecionados ou familia/organizacao;
- liberar funcionalidades especificas;
- visualizar dashboard consolidado;
- acompanhar relatorios;
- liberar ou bloquear modulos futuros.

## Platform admin

Na fase SaaS, deve existir a diferenca conceitual entre:

```txt
Platform admin
Organization admin
Member
```

O Platform admin e o operador/dono do SaaS. Ele pode precisar gerenciar suporte, planos, incidentes e configuracoes globais, mas nao deve ter acesso livre a dados financeiros sensiveis sem regra clara, necessidade operacional e auditoria.

Essa separacao deve ser planejada antes de billing e operacao comercial.

## Usuarios familiares/membros

Usuarios familiares terao acesso limitado conforme configuracao do Admin da organizacao.

Exemplos:

- Pai: ver e criar gastos proprios.
- Mae: ver dados proprios e dados liberados dos filhos.
- Filho: ver saldo proprio e lancar gastos.
- Perfil infantil: experiencia minima para registrar gastos e ver limite, podendo receber mais modulos se o Admin liberar.

No SaaS, esses usuarios pertencem a uma organizacao especifica e suas permissoes nao devem vazar para outra organizacao.

## Dashboard

O Dashboard deve ser contextual:

- usuario comum: dashboard pessoal dentro da organizacao ativa;
- usuario com pessoas liberadas: dashboard das pessoas autorizadas dentro da organizacao;
- admin da organizacao: dashboard consolidado da organizacao;
- platform admin: visao operacional da plataforma, sem misturar dados financeiros sensiveis de clientes sem regra clara.

O Dashboard final deve incluir:

- visao geral do mes;
- contas fixas;
- contas a pagar;
- contas a receber;
- bancos;
- rendas;
- gastos por pessoa;
- gastos por categoria;
- investimentos futuros;
- acoes futuras;
- graficos;
- alertas;
- projecoes.

## Billing futuro

Billing e parte da visao SaaS, mas nao deve ser implementado antes do isolamento multi-tenant.

A ordem correta e:

```txt
organizations -> memberships -> organization_id -> queries/actions -> RLS -> UX/PWA -> rotas -> billing
```

Possiveis planos futuros:

- free;
- family_basic;
- family_plus;
- family_pro.

Possiveis limites por plano:

- quantidade de membros;
- historico disponivel;
- exportacoes;
- relatorios avancados;
- notificacoes;
- anexos;
- numero de bancos;
- numero de usuarios com login.

## Documentacao estrategica

A estrategia detalhada de permissoes, escopo de dados, funcionalidades liberaveis e evolucao do Dashboard esta em:

- `docs/PERMISSION_AND_DASHBOARD_STRATEGY.md`

A estrategia SaaS multi-tenant esta em:

- `docs/SAAS_MULTI_TENANT_STRATEGY.md`

A solicitacao formal de mudanca PMBOK esta em:

- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`

A decisao SaaS-first vigente esta em:

- `docs/adr/0001-saas-first-production-positioning.md`

## Principio de produto

O sistema deve ser simples para uso familiar, mas estruturado o suficiente para controle real de permissoes, seguranca, dashboard avancado, isolamento por organizacao, evolucao mobile, auditoria futura e modelo SaaS.

O maior risco do produto nao e evoluir para SaaS. O maior risco e evoluir rapido demais, misturando banco, RLS, rotas, visual e billing sem fases claras.

A visao do produto passa a ser: construir uma central financeira SaaS, mobile-first, multi-tenant, segura, incremental, comercialmente valiosa e preparada para producao massiva.
