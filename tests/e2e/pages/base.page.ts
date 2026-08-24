import type { Locator, Page } from "@playwright/test"
import { expect } from "@playwright/test"

/**
 * Faz 8 - shared Page Object base. Keep this thin: navigation + the handful
 * of chrome-level locators every page shares. Feature pages extend it and
 * expose *semantic* locators (getByRole / getByLabel / getByText);
 * `data-testid` only where there is no accessible equivalent.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Route relative to `baseURL`, e.g. "/cart". */
  abstract readonly path: string

  async goto(query?: Record<string, string>): Promise<void> {
    const search = query ? `?${new URLSearchParams(query).toString()}` : ""
    await this.page.goto(`${this.path}${search}`)
  }

  get mainHeading(): Locator {
    return this.page.getByRole("heading", { level: 1 })
  }

  get toast(): Locator {
    // sonner renders each toast as a plain <li data-sonner-toast> inside
    // [data-sonner-toaster] - it does NOT set role="status" (verified against
    // node_modules/sonner/dist/index.mjs), so a role-based locator matches nothing.
    return this.page.locator("[data-sonner-toaster] li[data-sonner-toast]")
  }

  /** Cart badge in the storefront header (count of cart items). */
  get cartBadge(): Locator {
    return this.page.getByRole("link", { name: /cart/i })
  }

  async expectUrl(pattern: RegExp | string): Promise<void> {
    await expect(this.page).toHaveURL(pattern)
  }
}
