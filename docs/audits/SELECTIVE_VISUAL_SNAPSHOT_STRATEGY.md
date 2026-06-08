# Selective visual snapshot strategy

> Status DocDoc: Atual
> Uso atual: estrategia vigente para snapshot visual seletivo e deterministico.
> Observacao: nao autoriza snapshot amplo sem contrato de superficie e fixture.

Atualizado em: 2026-06-08

## Objetivo

Este documento define a estrategia minima para snapshots visuais seletivos antes de qualquer redesign amplo.

Ele continua o GAP-011 depois dos contratos de:

- dashboard;
- listas financeiras primarias;
- formularios financeiros primarios.

## Decisao

Snapshots visuais devem ser seletivos, pequenos e deterministas.

O projeto nao deve adicionar snapshot amplo de telas inteiras sem contrato previo, porque isso cria falso ruido de manutencao e nao prova a estabilidade das superficies financeiras criticas.

## O que pode virar snapshot primeiro

As primeiras candidatas devem ser superficies ja cobertas por contrato textual:

1. dashboard summary acima da dobra;
2. uma lista financeira primaria com dados estaveis;
3. um formulario financeiro primario em estado create;
4. um estado vazio financeiro;
5. um estado de erro/feedback com `AppActionFeedback`.

## O que nao deve virar snapshot agora

Nao criar snapshot visual para:

- fluxo completo autenticado com dados reais;
- telas com dados remotos variaveis;
- pagina inteira protegida com navegacao e conteudo dinamico;
- billing;
- RLS live gate;
- orgSlug E2E;
- qualquer tela antes de existir fixture deterministica.

## Requisitos para o primeiro snapshot

Antes do primeiro snapshot visual, o PR deve definir:

- superficie unica;
- viewport unico inicial;
- fixture deterministica;
- objetivo do snapshot;
- criterio de atualizacao;
- comando local esperado;
- estrategia para evitar dados reais ou secretos;
- rollback simples caso o snapshot fique instavel.

## Relacao com contratos atuais

O snapshot visual nao substitui os guards existentes.

Ele deve complementar:

- `docs/audits/DASHBOARD_UI_CONTRACT.md`;
- `docs/audits/FINANCE_LIST_UI_CONTRACT.md`;
- `docs/audits/FINANCE_FORM_UI_CONTRACT.md`;
- `docs/audits/DASHBOARD_SUMMARY_VISUAL_FIXTURE.md`;
- `docs/design/VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md`;
- ADR 0003.

## Fora de escopo

Este documento nao:

- adiciona Playwright screenshot;
- adiciona dependencia visual;
- altera componentes;
- altera tokens;
- redesenha telas;
- altera schema, RLS, billing ou rotas;
- remove `owner_id`.

## Proximo passo seguro

O primeiro snapshot visual seletivo ja escolheu apenas uma superficie e gerou baseline versionado com fixture local deterministica.

Baseline inicial:

```txt
dashboard summary acima da dobra com fixture local deterministica
```

## Status da fixture inicial

A fixture local deterministica definida para a primeira superficie esta em:

```txt
__tests__/fixtures/dashboard-summary-visual-snapshot.ts
```

Contrato documental:

```txt
docs/audits/DASHBOARD_SUMMARY_VISUAL_FIXTURE.md
```

Estado atual:

- fixture local deterministica definida;
- viewport inicial unico definido;
- criterio de atualizacao e rollback definidos;
- Playwright screenshot gated implementado em `tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts`;
- PNG Windows versionado em `tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts-snapshots/dashboard-summary-above-fold-chromium-win32.png`;
- baselines Linux/macOS devem usar os sufixos de plataforma padrao do Playwright enquanto a fixture usar fontes de sistema;
- nenhum snapshot visual amplo implementado.
