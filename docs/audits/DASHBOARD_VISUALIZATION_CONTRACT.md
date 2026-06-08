# Dashboard Visualization Contract

> Status DocDoc: Atual
> Uso atual: contrato vigente do GAP-018 para definir graficos, series
> temporais e insights do dashboard antes de adicionar dependencia de charting.
> Atualizado em: 2026-06-08.

## Objetivo

Este contrato reduz o GAP-018 sem implementar runtime novo.

Ele define quais visualizacoes podem entrar no dashboard, quais dados devem
alimentar cada insight e quais limites bloqueiam uma biblioteca de chart antes
de existir aceite de produto.

Este documento nao adiciona dependencia, nao altera UI e nao cria graficos.
Tambem nao declara GAP-018 runtime como implementado.

## Estado atual

O dashboard atual ja possui:

- contrato textual em `docs/audits/DASHBOARD_UI_CONTRACT.md`;
- fixture deterministica em `docs/audits/DASHBOARD_SUMMARY_VISUAL_FIXTURE.md`;
- agregacoes financeiras server-side em `lib/finance/*-dashboard-server.ts`;
- dados de gastos, contas a pagar, contas a receber, bancos, limite mensal e
  permissoes por modulo;
- snapshot visual seletivo gated para a primeira dobra.

O projeto ainda nao possui biblioteca de charting dedicada como Recharts,
Chart.js, D3 ou Victory.

## Principios de produto

Qualquer grafico do dashboard deve responder uma pergunta financeira clara.

Nao adicionar graficos apenas por decoracao. Cada visualizacao precisa ter:

- pergunta de usuario;
- fonte de dados server-side;
- regra de permissao;
- estado vazio;
- estado de dado parcial;
- comportamento mobile-first;
- fallback textual equivalente;
- criterio de aceite.

## Insights permitidos primeiro

### 1. Tendencia mensal de gastos

Pergunta: "Como meus gastos evoluiram nos ultimos meses?"

Dados minimos:

- mes de referencia;
- total de gastos por mes;
- limite mensal vigente no periodo;
- percentual de uso do limite.

Regras:

- usar somente dados da organizacao ativa;
- respeitar visibilidade por membro/modulo;
- nao misturar contas pagas, abertas e rendas na mesma serie sem legenda clara.

### 2. Composicao de dividas abertas

Pergunta: "O que compoe minhas dividas abertas?"

Dados minimos:

- total aberto;
- fatias por status ou tipo;
- contagem por grupo;
- destaque de vencidas.

Regras:

- status deve seguir as mesmas regras dos helpers de contas a pagar;
- vencidas devem ser distinguiveis sem depender apenas de cor.

### 3. Fluxo previsto do mes

Pergunta: "Quanto ainda entra e quanto ainda sai neste mes?"

Dados minimos:

- valores a receber pendentes;
- contas a pagar pendentes;
- saldo previsto;
- proximos vencimentos.

Regras:

- sempre mostrar explicacao textual do saldo previsto;
- nao prometer previsao automatica alem dos dados cadastrados.

### 4. Uso de limite por categoria

Pergunta: "Quais categorias pressionam meu limite?"

Dados minimos:

- categoria;
- gasto total;
- percentual do limite ou do total de gastos;
- comparacao com limite mensal quando aplicavel.

Regras:

- categorias sem permissao nao aparecem;
- categorias vazias devem ter estado vazio textual.

## Bloqueios antes de charting

Nao adicionar biblioteca de charting enquanto o PR nao definir:

- o insight escolhido;
- o dataset minimo;
- o componente alvo;
- o fallback textual;
- as regras de permissao;
- o estado mobile;
- a estrategia de snapshot ou guard;
- o impacto de bundle;
- rollback sem perda de dados.

## Regras tecnicas

- Dados de grafico devem ser derivados no servidor ou em helper puro testavel.
- Client Components podem formatar e renderizar, mas nao devem recalcular
  permissao, tenant scope ou status financeiro de fonte persistida.
- Chart tooltip nao pode ser a unica forma de acessar informacao critica.
- Labels, valores e tendencia devem existir em texto para acessibilidade.
- Graficos devem usar tokens existentes de `docs/design`.
- Qualquer nova dependencia precisa de PR proprio se alterar bundle ou design
  system de forma relevante.

## Fora de escopo

Este contrato nao:

- adiciona Recharts, Chart.js, D3, Victory ou similar;
- muda dashboard atual;
- altera dados financeiros;
- altera schema, RLS, billing, permissoes ou deploy;
- cria snapshot novo;
- remove `owner_id`;
- declara GAP-018 runtime como implementado.

## Proxima expansao segura

1. Escolher apenas um insight inicial.
2. Criar helper server-side ou pure helper para o dataset.
3. Adicionar fallback textual antes do grafico.
4. Avaliar biblioteca ou SVG/CSS proprio conforme complexidade.
5. Se houver chart library, abrir PR dedicado com impacto de bundle e rollback.

## Acceptance

Um PR futuro que implementa visualizacao do dashboard deve:

- citar este contrato;
- declarar qual insight esta implementando;
- manter tenant scope e permissoes server-side;
- preservar `/protected` e `/org/[orgSlug]`;
- manter fallback textual;
- nao ampliar snapshot visual sem contrato;
- atualizar `docs/SAAS_GAP_REGISTER.md` quando houver runtime real.
