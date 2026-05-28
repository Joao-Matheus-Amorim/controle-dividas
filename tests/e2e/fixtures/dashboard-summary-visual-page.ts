import {
  dashboardSummaryVisualSnapshotFixture,
  dashboardSummaryVisualSnapshotSurface,
} from "@/__tests__/fixtures/dashboard-summary-visual-snapshot";
import { compactCurrency } from "@/components/dashboard/dashboard-utils";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderDashboardSummaryVisualFixturePage() {
  const { header, hero, quickActions, summaryRows, payables } =
    dashboardSummaryVisualSnapshotFixture;

  return String.raw`
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="dark" />
    <title>${escapeHtml(dashboardSummaryVisualSnapshotSurface.description)}</title>
    <style>
      :root {
        color-scheme: dark;
        background: #050508;
        color: #ffffff;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: #050508;
      }

      [data-visual-snapshot="${dashboardSummaryVisualSnapshotSurface.id}"] {
        display: grid;
        gap: 16px;
        width: 390px;
        min-height: 844px;
        padding: 20px;
        background:
          radial-gradient(circle at 12% 5%, rgba(139, 114, 248, 0.16), transparent 28%),
          linear-gradient(180deg, #07070c 0%, #050508 100%);
      }

      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .eyebrow,
      .metric-label,
      .card-kicker {
        margin: 0;
        color: rgba(255, 255, 255, 0.34);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .period {
        font-size: 12px;
        letter-spacing: 0.24em;
      }

      h1 {
        margin: 8px 0 0;
        font-size: 36px;
        font-weight: 900;
        line-height: 0.95;
      }

      .lead {
        margin: 10px 0 0;
        max-width: 300px;
        color: rgba(255, 255, 255, 0.46);
        font-size: 14px;
        line-height: 1.55;
      }

      .admin-button,
      .icon-box {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 44px;
        height: 44px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.055);
        color: #b09cff;
        font-weight: 900;
      }

      .hero {
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 32px;
        padding: 20px;
        background:
          radial-gradient(circle at 85% 12%, rgba(139, 114, 248, 0.28), transparent 34%),
          linear-gradient(145deg, #17112f 0%, #0b0b14 52%, #07070c 100%);
        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.42);
      }

      .hero-top,
      .section-top,
      .row,
      .quick-action {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .hero-value {
        margin: 8px 0 0;
        font-size: 42px;
        font-weight: 950;
        letter-spacing: -0.05em;
      }

      .badge {
        border: 1px solid rgba(29, 233, 178, 0.22);
        border-radius: 999px;
        padding: 7px 11px;
        background: rgba(29, 233, 178, 0.1);
        color: #1de9b2;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .bar {
        height: 8px;
        margin-top: 20px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.1);
      }

      .bar-fill {
        height: 100%;
        width: ${hero.usedPercent}%;
        border-radius: inherit;
        background: #8b72f8;
      }

      .metrics {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 20px;
      }

      .metric,
      .panel,
      .row {
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.055);
      }

      .metric {
        min-width: 0;
        border-radius: 16px;
        padding: 12px;
      }

      .metric-value {
        margin: 5px 0 0;
        overflow: hidden;
        color: #fff;
        font-size: 14px;
        font-weight: 800;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .quick-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .quick-action {
        min-height: 76px;
        justify-content: flex-start;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 18px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.045);
      }

      .quick-copy,
      .row-copy {
        min-width: 0;
      }

      .quick-title,
      .row-title,
      .row-value {
        margin: 0;
        overflow: hidden;
        color: #ffffff;
        font-size: 13px;
        font-weight: 800;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .quick-subtitle,
      .row-detail,
      .section-subtitle {
        margin: 3px 0 0;
        overflow: hidden;
        color: rgba(255, 255, 255, 0.36);
        font-size: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .panel {
        display: grid;
        gap: 14px;
        border-radius: 22px;
        padding: 16px;
      }

      h2 {
        margin: 0;
        font-size: 17px;
        line-height: 1.1;
      }

      .rows {
        display: grid;
        gap: 8px;
      }

      .row {
        border-radius: 16px;
        padding: 12px;
        background: rgba(8, 8, 16, 0.45);
      }

      .row-left {
        display: flex;
        align-items: center;
        min-width: 0;
        gap: 12px;
      }

      .small-stat-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .small-stat {
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 12px;
        background: rgba(8, 8, 16, 0.45);
      }
    </style>
  </head>
  <body>
    <main data-visual-snapshot="${dashboardSummaryVisualSnapshotSurface.id}">
      <section class="header">
        <div>
          <p class="eyebrow period">${escapeHtml(header.periodContextLabel)}</p>
          <h1>${escapeHtml(header.heading)}</h1>
          <p class="lead">${escapeHtml(header.description)}</p>
        </div>
        <div class="admin-button" aria-label="Abrir admin">A</div>
      </section>

      <section class="hero">
        <div class="hero-top">
          <div>
            <p class="eyebrow">Disponivel</p>
            <p class="hero-value">${compactCurrency(hero.remainingMonthlyLimit)}</p>
          </div>
          <div class="badge">saudavel</div>
        </div>
        <div class="bar"><div class="bar-fill"></div></div>
        <div class="metrics">
          <div class="metric">
            <p class="metric-label">Gasto</p>
            <p class="metric-value">${compactCurrency(hero.totalExpenses)}</p>
          </div>
          <div class="metric">
            <p class="metric-label">Limite</p>
            <p class="metric-value">${compactCurrency(hero.totalMonthlyLimit)}</p>
          </div>
          <div class="metric">
            <p class="metric-label">Dividas</p>
            <p class="metric-value" style="color:#f7b84b">${compactCurrency(hero.totalOpenDebts)}</p>
          </div>
          <div class="metric">
            <p class="metric-label">Receber</p>
            <p class="metric-value" style="color:#1de9b2">${compactCurrency(hero.totalReceivableIncomes)}</p>
          </div>
        </div>
      </section>

      <section class="quick-grid">
        ${quickActions.map((action) => String.raw`
          <div class="quick-action">
            <div class="icon-box" style="color:${action.color}">${escapeHtml(action.iconKey.slice(0, 1))}</div>
            <div class="quick-copy">
              <p class="quick-title">${escapeHtml(action.title)}</p>
              <p class="quick-subtitle">${escapeHtml(action.subtitle)}</p>
            </div>
          </div>
        `).join("")}
      </section>

      <section class="panel">
        <div class="section-top">
          <div>
            <h2>Resumo financeiro</h2>
            <p class="section-subtitle">Apenas modulos liberados</p>
          </div>
          <div class="icon-box">R</div>
        </div>
        <div class="rows">
          ${summaryRows.map((row) => String.raw`
            <div class="row">
              <div class="row-left">
                <div class="icon-box" style="color:${row.color}">${escapeHtml(row.iconKey.slice(0, 1))}</div>
                <div class="row-copy">
                  <p class="row-title">${escapeHtml(row.label)}</p>
                  <p class="row-detail">${escapeHtml(row.detail)}</p>
                </div>
              </div>
              <p class="row-value">${escapeHtml(row.value)}</p>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="panel">
        <div class="section-top">
          <div>
            <h2>Contas e dividas</h2>
            <p class="section-subtitle">Fixas, avulsas e atrasadas</p>
          </div>
          <div class="icon-box">C</div>
        </div>
        <div class="small-stat-grid">
          <div class="small-stat">
            <p class="card-kicker">Pendentes</p>
            <p class="row-value">${payables.pendingCount} - ${compactCurrency(payables.totalPending)}</p>
          </div>
          <div class="small-stat">
            <p class="card-kicker">Atrasadas</p>
            <p class="row-value">${payables.overdueCount} - ${compactCurrency(payables.totalOverdue)}</p>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`;
}
