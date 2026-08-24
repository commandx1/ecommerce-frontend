import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/** Vendor orders page (`/vendor-dashboard/orders`). */
export class VendorOrdersPage extends BasePage {
  readonly path = "/vendor-dashboard/orders"

  get callUberButtons(): Locator {
    return this.page.getByRole("button", { name: "Call Uber" })
  }

  get trackLabelsButtons(): Locator {
    return this.page.getByRole("button", { name: "Track / Labels" })
  }

  get cancelItemButtons(): Locator {
    return this.page.getByRole("button", { name: "Cancel Item" })
  }

  get confirmCancelButton(): Locator {
    return this.page.getByRole("button", { name: "Confirm cancel" })
  }

  get keepOrderButton(): Locator {
    return this.page.getByRole("button", { name: "Keep order" })
  }

  get printLabelButtons(): Locator {
    return this.page.getByRole("button", { name: "Print", exact: false })
  }

  get uberResultHeading(): Locator {
    return this.page.getByRole("heading", { name: "Uber Delivery Result" })
  }

  /**
   * Order rows only render an "expander" chevron button (`orders-table.tsx`,
   * `id: "expander"`) - the `<tr>` itself has no `onClick` (`onRowClick` isn't
   * passed to `DataTable`), so item-level actions (Cancel Item, Track /
   * Labels) only appear once a row is explicitly expanded via that button.
   */
  async expandOrderRow(index = 0): Promise<void> {
    const dataRows = this.page.getByRole("table").locator("tbody > tr")
    // Column order is buyer/created/quantity/items/price/shipping/status/
    // action("Call Uber")/expander - the expander chevron is the LAST button
    // in the row, not the first (the "action" cell's "Call Uber" button
    // renders before it).
    await dataRows.nth(index).locator("button").last().click()
  }
}
