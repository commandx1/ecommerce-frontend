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
    // - match both so callers can inspect which state it's actually in.
    return this.page.getByRole("button", { name: /^(Add to Cart|Out of Stock)$/ })
  }

  /** Supplier comparison table rows' "Select" button (SupplierComparisonRow.tsx) - excludes the already-selected one, which reads "Selected". */
  get selectSupplierButtons(): Locator {
    return this.page.getByRole("button", { name: "Select", exact: true })
  }

  get selectedSupplierButton(): Locator {
    return this.page.getByRole("button", { name: "Selected", exact: true })
  }
}
