# FamilyFinance - Visao do Produto

## Definicao

FamilyFinance e uma solucao financeira familiar personalizada para uma familia especifica.

O projeto nao sera tratado, nesta fase, como SaaS, produto publico, sistema para multiplas familias ou aplicacao comercial por assinatura.

## Produto final

O produto final desejado e um aplicativo nativo Android e iOS, com painel web administrativo de apoio.

A web atual tambem funciona como PWA/mobile-first para validar a experiencia de app, fluxos, permissoes, dashboard e regras financeiras antes de uma versao nativa.

## Visao central

O FamilyFinance nao e apenas um controle de gastos. Ele deve evoluir para uma central financeira familiar com:

- dashboard contextual;
- contas fixas;
- contas a pagar;
- contas a receber;
- bancos;
- rendas fixas e variaveis;
- gastos por pessoa;
- categorias;
- investimentos;
- acoes;
- graficos;
- alertas;
- permissoes dinamicas.

Cada usuario deve ver apenas o que o Admin liberar.

## Regra de permissao do produto

A regra oficial e:

```txt
Role define o padrao inicial.
Admin define a permissao real.
Permissao sempre vence o role.
```

Isso significa que usuarios comuns veem apenas seus proprios dados por padrao, mas o Admin pode liberar modulos, funcionalidades, acoes e dados de outras pessoas.

Perfis infantis, como Caleb, sao apenas presets iniciais restritos. O Admin pode liberar qualquer modulo para eles se quiser.

## Papel do painel web atual

O painel web em Next.js continua importante e sera usado como:

- backoffice administrativo;
- ambiente de validacao das regras financeiras;
- painel do Admin familiar;
- referencia funcional para o app mobile;
- PWA temporario para uso no celular;
- ferramenta de suporte e configuracao;
- laboratorio do Dashboard completo.

## Papel do app nativo

O app nativo sera o principal canal de uso diario da familia.

Ele deve priorizar:

- experiencia de app;
- dashboard conforme permissao;
- lancamento rapido de gastos;
- consulta de saldo individual;
- notificacoes de vencimento;
- visualizacao de contas autorizadas;
- visualizacao de bancos autorizados;
- visualizacao de investimentos autorizados;
- login persistente;
- navegacao simples por permissoes.

## Admin familiar

O Admin familiar permanece como pilar central do sistema.

Ele podera:

- ver tudo;
- criar usuarios familiares;
- vincular usuarios a membros financeiros;
- definir limites;
- gerenciar categorias;
- gerenciar bancos;
- definir permissoes por modulo;
- definir permissoes de ver, criar, editar e excluir;
- definir escopo de dados: proprio, selecionados ou familia;
- liberar funcionalidades especificas;
- visualizar dashboard consolidado;
- acompanhar relatorios;
- liberar ou bloquear investimentos, graficos e modulos futuros.

## Usuarios familiares

Usuarios familiares terao acesso limitado conforme configuracao do Admin.

Exemplos:

- Pai: ver e criar gastos proprios.
- Mae: ver dados proprios e dados liberados dos filhos.
- Gabryel: ver saldo proprio e lancar gastos.
- Caleb: pode ter experiencia minima apenas para registrar gastos e ver limite, mas pode receber mais modulos se o Admin liberar.

## Dashboard

O Dashboard deve ser contextual:

- usuario comum: dashboard pessoal;
- usuario com pessoas liberadas: dashboard das pessoas autorizadas;
- admin: dashboard familiar consolidado.

O Dashboard final deve incluir:

- visao geral do mes;
- contas fixas;
- contas a pagar;
- contas a receber;
- bancos;
- rendas;
- gastos por pessoa;
- gastos por categoria;
- investimentos;
- acoes;
- graficos;
- alertas;
- projecoes.

## Documentacao estrategica

A estrategia detalhada de permissoes, escopo de dados, funcionalidades liberaveis e evolucao do Dashboard esta em:

- `docs/PERMISSION_AND_DASHBOARD_STRATEGY.md`

## Principio de produto

O sistema deve ser simples para uso familiar, mas estruturado o suficiente para controle real de permissoes, seguranca, dashboard avancado e evolucao futura.
