# Dashboard summary visual fixture

Atualizado em: 2026-06-08

## Objetivo

Este contrato define a fixture local deterministica para o primeiro snapshot visual seletivo do GAP-011.

A superficie escolhida e:

```txt
dashboard summary acima da dobra
```

## Fonte da fixture

```txt
__tests__/fixtures/dashboard-summary-visual-snapshot.ts
```

## Escopo

A fixture cobre somente a primeira dobra do dashboard:

- `DashboardHeader`;
- `DashboardHeroSummary`;
- `DashboardQuickActions`;
- `DashboardSummarySection`.

Ela exclui de proposito:

- `DashboardFamilySummary`;
- `DashboardUpcomingBills`;
- `DashboardCategorySummary`;
- `DashboardBankSummary`;
- `DashboardIncomeSummary`;
- fluxos autenticados reais;
- dados remotos;
- dados secretos.

## Viewport inicial

O primeiro alvo visual deve usar um viewport unico:

```txt
390x844, deviceScaleFactor 1, dark mode
```

## Decisao

A fixture local deterministica prepara o primeiro snapshot visual seletivo.

O snapshot real e gated por flag dedicada e usa esta fixture como entrada estavel:

```txt
tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts
```

Por padrao, o teste nao roda no CI comum. Ele exige:

```txt
RUN_DASHBOARD_SUMMARY_VISUAL_SNAPSHOT=true
```

## Regras

- Nao buscar dados remotos.
- Nao usar Supabase.
- Nao usar secrets ou variaveis de ambiente.
- Nao depender de data/hora corrente.
- Nao capturar pagina inteira.
- Nao misturar billing, RLS, schema ou rotas.
- Nao atualizar snapshot sem explicar a mudanca de contrato.

## Evidencia versionada

O primeiro snapshot foi gerado localmente com o gate dedicado e versionado em:

```txt
tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts-snapshots/dashboard-summary-above-fold.png
```

O Playwright usa `snapshotPathTemplate` sem sufixo de plataforma para este
baseline, entao o mesmo arquivo e usado em Windows, Linux e macOS.

Evidencia de execucao local:

```txt
RUN_DASHBOARD_SUMMARY_VISUAL_SNAPSHOT=true
tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts
2 passed
2026-06-08
```

Esta evidencia cobre somente `dashboard-summary-above-fold`.

Ela nao cobre:

- app protegido completo;
- fluxo autenticado real;
- dados remotos;
- multiplos viewports;
- listas, formularios, billing, RLS, schema ou rotas.

## Comando local esperado neste passo

PowerShell:

```txt
$env:RUN_DASHBOARD_SUMMARY_VISUAL_SNAPSHOT="true"; npm run test:e2e -- tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts --update-snapshots; Remove-Item Env:\RUN_DASHBOARD_SUMMARY_VISUAL_SNAPSHOT
```

Bash:

```txt
RUN_DASHBOARD_SUMMARY_VISUAL_SNAPSHOT=true npm run test:e2e -- tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts --update-snapshots
```

## Proximo passo

Usar este snapshot como baseline seletivo do dashboard summary acima da dobra.

Qualquer novo snapshot deve continuar em PR proprio, com superficie documentada,
fixture deterministica, comando gated e rollback simples.
