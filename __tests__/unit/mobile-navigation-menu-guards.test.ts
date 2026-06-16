import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("mobile navigation menu guards", () => {
  const appShell = readSource("components/app/app-shell.tsx");
  const mobileNavigation = readSource("components/app/mobile-bottom-navigation.tsx");

  it("keeps every permitted app area available from the mobile menu", () => {
    expect(appShell).toContain('"/protected/pessoas"');
    expect(appShell).toContain('"/protected/gastos"');
    expect(appShell).toContain('"/protected/contas-a-pagar"');
    expect(appShell).toContain('"/protected/contas-a-receber"');
    expect(appShell).toContain('"/protected/bancos"');
    expect(appShell).toContain('"/protected/relatorios"');
    expect(appShell).toContain('"/protected/configuracoes"');
    expect(appShell).toContain('"/protected/admin"');
    expect(appShell).toContain("mobileAllItems = visibleNavigation.map");
    expect(appShell).toContain("<MobileBottomNavigation");
    expect(appShell).not.toContain("const mobileNavigation");
  });

  it("uses a compact bottom nav plus an app-style full menu on mobile", () => {
    expect(appShell).toContain('["DASHBOARD", "GASTOS", "CONTAS_A_PAGAR", "BANCOS"]');
    expect(mobileNavigation).toContain("Abrir menu completo");
    expect(mobileNavigation).toContain("Todas as áreas liberadas");
    expect(mobileNavigation).toContain("allItems.map");
    expect(mobileNavigation).toContain("SheetClose asChild");
    expect(mobileNavigation).toContain("primaryItems.map");
    expect(mobileNavigation).toContain("SheetContent");
    expect(mobileNavigation).toContain("receivables: TrendingUp");
    expect(mobileNavigation).toContain("reports: BarChart3");
    expect(mobileNavigation).toContain("settings: Settings");
  });
});
