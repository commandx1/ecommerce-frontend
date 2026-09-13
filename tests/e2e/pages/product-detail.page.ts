import type { Locator, Page } from "@playwright/test"
import { BasePage } from "./base.page"

/**
 * Product detail page (`/products/:id`). Server component for the initial
 * render; supplier selection and "Add to Cart" are client-side
 * (useSupplierSelection.ts / PurchaseOptions.tsx).
 */
export class ProductDetailPage extends BasePage {
  readonly path: string

  constructor(page: Page, productId: string) {
    super(page)
    this.path = `/products/${productId}`
  }

  get addToCartButton(): Locator {
    // PurchaseActions -> AsyncSubmitButton idleText="Add to Cart" (or "Out of Stock" when stockCount <= 0)
    // - match both so callers can inspect which state it's actually in. The Related Products
    // section below (real `ProductCard`s) renders its own "Add to Cart" buttons with the same
    // name, so `.first()` is required - the purchase panel precedes that section in DOM order.
    return this.page.getByRole("button", { name: /^(Add to Cart|Out of Stock)$/ }).first()
  }

  /** Supplier comparison table rows' "Select" button (SupplierComparisonRow.tsx) - excludes the already-selected one, which reads "Selected". */
  get selectSupplierButtons(): Locator {
    return this.page.getByRole("button", { name: "Select", exact: true })
  }

  get selectedSupplierButton(): Locator {
    return this.page.getByRole("button", { name: "Selected", exact: true })
  }

  /**
   * Heart toggle (FavoriteProductButton) in the hero badge row
   * (ProductHeroDetails.tsx). Matches only the real toggle's two accessible
   * names ("Save to favorites" / "Remove from favorites") - the "Related
   * Products" section below the hero (RelatedProducts.tsx) now renders real
   * `ProductCard`s with their own `FavoriteProductButton`s carrying the same
   * accessible names, so `.first()` is required: the hero gallery precedes
   * the Related Products section in DOM order, so it always wins.
   */
  favoriteToggle(productName?: string | RegExp): Locator {
    void productName
    return this.page.getByRole("button", { name: /^(Save to favorites|Remove from favorites)$/ }).first()
  }
}
