import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/**
 * Faz 8.2 - public vendor directory at /vendors (legacy `/suppliers` route
 * `redirect()`s here, see src/app/suppliers/page.tsx). Rendered by
 * SuppliersDirectorySection (src/features/suppliers/components/SuppliersDirectorySection.client.tsx).
 *
 * FINDING: this page has no search input and no card/table view toggle -
 * `search` is a supported `getVendors()` query param (src/lib/api/vendors.ts)
 * but no UI wires it up anywhere, and the grid/table toggle only exists on
 * the buyer-dashboard favorites page (FavoriteSuppliersPage), which has no
 * search/filter of its own. See the spec file header for what is and isn't
 * covered here.
 */
export class SuppliersDirectoryPage extends BasePage {
  readonly path = "/vendors"

  /**
   * FINDING: overrides BasePage's `toast` getter - the installed `sonner`
   * never renders `role="status"` (each toast is a plain
   * `<li data-sonner-toast>`), so `[data-sonner-toaster] [role='status']`
   * matches nothing. See buyer-auto-orders.page.ts's `toast` getter for the
   * full verification note.
   */
  get toast(): Locator {
    return this.page.locator("[data-sonner-toaster] li[data-sonner-toast]")
  }

  get ratingFilter(): Locator {
    return this.page.getByRole("combobox", { name: "Filter by rating" })
  }

  get sortSelect(): Locator {
    return this.page.getByRole("combobox", { name: "Sort suppliers" })
  }

  option(label: string | RegExp): Locator {
    return this.page.getByRole("option", { name: label })
  }

  supplierCard(name: string | RegExp): Locator {
    return this.page.locator("article", { has: this.page.getByRole("heading", { name, level: 3 }) })
  }

  favoriteToggle(name: string | RegExp): Locator {
    return this.supplierCard(name).getByRole("button", { name: /favorites/i })
  }

  get nextPageButton(): Locator {
    return this.page.getByRole("button", { name: "Next page" })
  }

  pageButton(page: number): Locator {
    return this.page.getByRole("button", { name: String(page), exact: true })
  }

  get vendorsHeading(): Locator {
    return this.page.getByRole("heading", { name: "Browse Vendors" })
  }
}
