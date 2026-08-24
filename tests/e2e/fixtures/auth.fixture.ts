import type { Page } from "@playwright/test"
import { test as apiMockTest, expect } from "./api-mock.fixture"
import { buildBuyerAuthCookie, buildVendorAuthCookie } from "./auth-cookie"

/**
 * Faz 8.1 - authenticated page fixtures. Extends the `apiMock` test (see
 * ./api-mock.fixture.ts), so importing `test` from this file gives you both
 * `apiMock` and `buyerPage` / `vendorPage` / `guestPage`.
 *
 * `buyerPage`, `vendorPage` and `guestPage` all wrap the SAME underlying
 * Playwright `page` fixture (one browser context per test, as usual) - they
 * just differ in which cookie (if any) is seeded into that context before the
 * test body runs. Request exactly ONE of them per test; requesting two in the
 * same test would just have the later one's cookie setup overwrite the
 * earlier one's on the same context.
 */

interface AuthFixtures {
  buyerPage: Page
  vendorPage: Page
  guestPage: Page
}

export const test = apiMockTest.extend<AuthFixtures>({
  buyerPage: async ({ page, baseURL }, use) => {
    await page.context().addCookies([buildBuyerAuthCookie({}, baseURL)])
    await use(page)
  },

  vendorPage: async ({ page, baseURL }, use) => {
    await page.context().addCookies([buildVendorAuthCookie({}, baseURL)])
    await use(page)
  },

  guestPage: async ({ page }, use) => {
    await page.context().clearCookies()
    await use(page)
  },
})

export { expect }
