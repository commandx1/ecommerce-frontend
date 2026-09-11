import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/**
 * Buyer-dashboard favorites page (`/buyer-dashboard/favorites`), rendered by
 * FavoritesPage (src/features/favorites/FavoritesPage.tsx). Two tabs -
 * "Products" (FavoriteProductsTab) and "Vendors" (FavoriteSuppliersPage,
 * embedded) - switched via AnimatedTabs (src/components/ui/motion-tabs.tsx),
 * which renders each trigger with `role="tab"` and `data-state="active"` /
 * `data-state="inactive"` (no `aria-selected`).
 *
 * Legacy `/buyer-dashboard/vendors/favorites` (and `/vendors`, `/suppliers`,
 * `/suppliers/favorites`) `redirect()` here with `?tab=vendors`.
 */
export class FavoritesPage extends BasePage {
  readonly path = "/buyer-dashboard/favorites"

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "Favorites", level: 1 })
  }

  tab(name: "Products" | "Vendors"): Locator {
    return this.page.getByRole("tab", { name })
  }

  productCard(name: string | RegExp): Locator {
    return this.page.locator("h3", { hasText: name })
  }

  /**
   * ProductCard.tsx has no `article`/`data-testid` card root - the heart
   * button and the `<h3>` title live in sibling divs under a shared
   * `div.flex.flex-col` wrapper. `div:has(h3) + div:has(button)` isn't
   * expressible as a single CSS selector here, so instead: filter every
   * `div` down to ones containing BOTH the named `<h3>` and a
   * favorites-button descendant, then take the last (= most deeply nested,
   * hence most specific) match - document order lists a parent before its
   * children, so the innermost div satisfying both conditions is last.
   */
  favoriteToggle(withinCard?: string | RegExp): Locator {
    if (withinCard) {
      const card = this.page
        .locator("div")
        .filter({ has: this.page.locator("h3", { hasText: withinCard }) })
        .filter({ has: this.page.getByRole("button", { name: /^(Save to favorites|Remove from favorites)$/ }) })
        .last()
      return card.getByRole("button", { name: /^(Save to favorites|Remove from favorites)$/ })
    }
    return this.page.getByRole("button", { name: /^(Save to favorites|Remove from favorites)$/ })
  }

  get emptyState(): Locator {
    return this.page.getByText("No favorite products yet.")
  }
}
