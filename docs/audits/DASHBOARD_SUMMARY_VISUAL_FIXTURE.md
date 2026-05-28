# Dashboard summary visual fixture

Atualizado em: 2026-05-28

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

Validar o snapshot gerado localmente e manter o escopo restrito ao dashboard summary acima da dobra.
