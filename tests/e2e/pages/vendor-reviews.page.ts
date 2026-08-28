import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/** Vendor reviews dashboard (`/vendor-dashboard/reviews`). */
export class VendorReviewsPage extends BasePage {
  readonly path = "/vendor-dashboard/reviews"

  get errorBanner(): Locator {
    return this.page.getByText("Reviews could not be loaded. Please refresh the page to try again.")
  }

  get emptyState(): Locator {
    return this.page.getByText("No reviews yet for your products.")
  }

  reviewCard(title: string): Locator {
    return this.page.locator("article").filter({ hasText: title })
  }

  /** One row of the "Rating Breakdown" panel, e.g. `ratingRow(5)` for the 5-star row. */
  ratingRow(stars: number): Locator {
    return this.page.getByRole("button", { name: new RegExp(`^${stars}★`) })
  }

  /**
   * KPI cards (Average Rating / Total Reviews / Positive Ratio / Reviewed
   * Products) render as three stacked, unlabelled `<div>`s (label, value,
   * hint) - there's no accessible name tying the value to its label. The
   * value IS always the DOM sibling immediately before its (unique) hint
   * text, per the `kpis` array in page.tsx, so that relation is used instead
   * of a brittle class/index selector.
   */
  kpiValue(hint: string): Locator {
    return this.page.getByText(hint, { exact: true }).locator("xpath=preceding-sibling::div[1]")
  }
}
