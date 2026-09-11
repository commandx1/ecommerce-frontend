import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/**
 * Product listing page (`/products`). Server component - filters navigate via
 * `router.push` (see useProductFiltersNavigation.ts), so applying a filter is
 * a real URL change, not a client-only fetch.
 */
export class ProductListingPage extends BasePage {
  readonly path = "/products"

  /** "In Stock" availability checkbox, in the desktop filters sidebar (lg+ viewport only). */
  get inStockFilter(): Locator {
    // AvailabilityFilter is mounted twice (see ProductListingClient.tsx):
    // MobileFilters renders FIRST in DOM order (its drawer content, hidden
    // until opened), then the desktop `<aside class="hidden ... lg:block">`
    // - so `.last()` is the one actually visible at the default (1280px) viewport.
    return this.page.getByLabel("In Stock").last()
  }

  get productCards(): Locator {
    // ProductCard renders each product's name as an <h3><Link>...</Link></h3>.
    return this.page.locator("h3").filter({ has: this.page.locator("a") })
  }

  get productLinks(): Locator {
    return this.page.locator("a[href^='/products/']")
  }

  /**
   * Heart toggle (FavoriteProductButton) rendered top-right of each card's
   * image. Matches only the real toggle's two accessible names ("Save to
   * favorites" / "Remove from favorites") - a loose `/favorites/i` would
   * also match unrelated static UI on other pages. `productName` is
   * currently unused - the listing mock always returns a single product,
   * so `.first()` is unambiguous - but the param is kept so a future
   * multi-card fixture can scope it without changing every call site.
   */
  favoriteToggle(productName?: string | RegExp): Locator {
    void productName
    return this.page.getByRole("button", { name: /^(Save to favorites|Remove from favorites)$/ }).first()
  }
}
