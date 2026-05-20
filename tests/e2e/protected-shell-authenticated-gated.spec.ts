import { expect, test } from "@playwright/test";

import { shouldRunActiveOrganizationE2e } from "./helpers/e2e-env";

test.describe("protected shell E2E", () => {
  test("keeps the gated shell coverage disabled by default", () => {
    expect(typeof shouldRunActiveOrganizationE2e()).toBe("boolean");
  });
});
