import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/**
 * Home page (`/`). Only exposes the header search box - the rest of the
 * homepage isn't in scope for this POM. See MainSearchbox / useMainSearch
 * (src/components/search/main-searchbox/**) - it's a debounced (300ms)
 * autocomplete dropdown that links straight to `/products/:id`, NOT a
 * search-to-listing-page flow (there is no `search` query param on
 * `/products` - see parse-listing-search-params.ts).
 */
export class HomePage extends BasePage {
  readonly path = "/"

  get searchInput(): Locator {
    // Navbar mounts MainSearchbox TWICE (desktop `lg:block` + a mobile copy
    // under `lg:hidden`) - both exist in the DOM regardless of viewport, only
    // CSS-hidden. `.first()` is the desktop one, which the default viewport shows.
    return this.page.getByPlaceholder("Search products, brands, or suppliers...").first()
  }

  get searchResults(): Locator {
    // SearchResultsDropdown -> SearchResultItem renders a Link per result;
    // no shared accessible role/name, so scope by the dropdown's link href pattern.
    return this.page.locator("a[href^='/products/']")
  }

  async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query)
  }
}
