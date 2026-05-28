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

A fixture local deterministica definida neste PR prepara o primeiro snapshot, mas nao implementa Playwright screenshot e nao adiciona snapshot visual ainda.

O snapshot real deve ser feito em PR posterior, usando esta fixture como entrada estavel.

## Regras

- Nao buscar dados remotos.
- Nao usar Supabase.
- Nao usar secrets ou variaveis de ambiente.
- Nao depender de data/hora corrente.
- Nao capturar pagina inteira.
- Nao misturar billing, RLS, schema ou rotas.
- Nao atualizar snapshot sem explicar a mudanca de contrato.

## Comando local esperado neste passo

```txt
npm run test -- __tests__/unit/dashboard-summary-visual-fixture-guards.test.ts
```

## Proximo passo

Implementar o primeiro screenshot test usando a fixture deterministica do dashboard summary acima da dobra.
