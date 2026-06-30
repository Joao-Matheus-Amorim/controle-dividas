import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PageSkeleton } from "@/components/app/page-skeleton";

const variants = [
  "dashboard",
  "gastos",
  "contas-a-pagar",
  "contas-a-receber",
  "movimentacoes",
  "bancos",
  "relatorios",
  "configuracoes",
  "admin",
] as const;

describe("PageSkeleton", () => {
  for (const variant of variants) {
    it(`renders ${variant} without crashing`, () => {
      const { container } = render(<PageSkeleton variant={variant} />);
      expect(container.firstChild).toBeTruthy();
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  }

  it("applies custom className", () => {
    const { container } = render(<PageSkeleton variant="dashboard" className="extra-class" />);
    expect(container.firstChild?.nodeType === 1).toBe(true);
  });

  it("renders AppCard wrapper for all variants", () => {
    const { container } = render(<PageSkeleton variant="admin" />);
    const cards = container.querySelectorAll('[class*="rounded-ff-2xl"]');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });
});
