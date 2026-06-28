import { describe, expect, it } from "vitest";

import {
  getSettingsCurrencies,
  getSettingsCurrencyHelper,
  getSettingsCurrencyLabel,
  getSettingsTotalLimitHelper,
  getSettingsTotalLimitLabel,
} from "@/components/settings/settings-utils";
import type { DbFamilyMember } from "@/lib/finance/types";

function member(overrides: Partial<DbFamilyMember> = {}): DbFamilyMember {
  return {
    id: "member-1",
    owner_id: "owner-1",
    name: "Pessoa",
    role: "adult",
    monthly_limit: 100,
    currency: "EUR",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("settings currency summary", () => {
  it("keeps a single-currency summary when every member uses the same currency", () => {
    const members = [
      member({ id: "a", monthly_limit: 100, currency: "BRL" }),
      member({ id: "b", monthly_limit: 50, currency: "BRL" }),
    ];

    expect(getSettingsCurrencies(members)).toEqual(["BRL"]);
    expect(getSettingsCurrencyLabel(["BRL"])).toBe("BRL");
    expect(getSettingsCurrencyHelper(["BRL"])).toBeUndefined();
    expect(getSettingsTotalLimitLabel(members)).toContain("R$");
    expect(getSettingsTotalLimitHelper(members)).toBeUndefined();
  });

  it("marks mixed-currency totals without pretending they are directly comparable", () => {
    const members = [
      member({ id: "a", monthly_limit: 100, currency: "BRL" }),
      member({ id: "b", monthly_limit: 50, currency: "EUR" }),
    ];

    expect(getSettingsCurrencies(members)).toEqual(["BRL", "EUR"]);
    expect(getSettingsCurrencyLabel(["BRL", "EUR"])).toBe("2 moedas");
    expect(getSettingsCurrencyHelper(["BRL", "EUR"])).toBe("BRL • EUR");
    expect(getSettingsTotalLimitLabel(members)).toBe("Moedas mistas");
    expect(getSettingsTotalLimitHelper(members)).toBe("2 limites em 2 moedas");
  });
});
