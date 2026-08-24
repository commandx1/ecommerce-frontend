import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/**
 * /buyer-dashboard/orders (OrdersTable, see
 * src/app/buyer-dashboard/orders/components/orders-table.tsx). Real columns,
 * verified against that file: Date, Seller / Store, Items, Net Total,
 * Shipment Fee, plus a trailing unlabeled expander column. There is NO
 * "Payment Method" / "Payment Status" / "Shipment Status" / "Tracking"
 * column - an earlier version of buyer-orders.smoke.spec.ts asserted those
 * and was wrong even before this rewrite.
 */
export class BuyerOrdersPage extends BasePage {
  readonly path = "/buyer-dashboard/orders"

  get toast(): Locator {
    // See BuyerAutoOrdersPage's identical override: sonner never sets
    // role="status" (grepped node_modules/sonner/dist/index.mjs).
    return this.page.locator("[data-sonner-toaster] li[data-sonner-toast]")
  }

  // -- Status tabs (src/.../components/orders-status-tabs.tsx) --

  statusTab(tab: "All" | "Pending" | "Shipped" | "Delivered" | "Cancelled" | "Returned"): Locator {
    return this.page.getByRole("button", { name: tab, exact: true })
  }

  // -- Table --

  get dateColumnHeader(): Locator {
    return this.page.getByRole("columnheader").filter({ hasText: "Date" })
  }

  get sellerColumnHeader(): Locator {
    return this.page.getByRole("columnheader", { name: "Seller / Store" })
  }

  get itemsColumnHeader(): Locator {
    return this.page.getByRole("columnheader", { name: "Items" })
  }

  get netTotalColumnHeader(): Locator {
    return this.page.getByRole("columnheader").filter({ hasText: "Net Total" })
  }

  get shipmentFeeColumnHeader(): Locator {
    return this.page.getByRole("columnheader", { name: "Shipment Fee" })
  }

  get tableRows(): Locator {
    return this.page.locator("tbody tr")
  }

  /** Clicks the trailing expander button on the first data row. */
  async expandFirstRow(): Promise<void> {
    await this.tableRows.first().getByRole("button").click()
  }

  // -- Expanded order details (order-expanded-content.tsx) --

  // The desktop table and the md:hidden mobile list both render an expanded
  // row's content in the DOM at once (only one is visually shown, via CSS,
  // depending on viewport) - `.filter({ visible: true })` picks whichever
  // one the current viewport actually shows instead of assuming DOM order.
  get orderItemsHeading(): Locator {
    return this.page.getByRole("heading", { name: "Order Items" }).filter({ visible: true })
  }

  get customerDetailsHeading(): Locator {
    return this.page.getByText("Customer Details").filter({ visible: true })
  }

  reorderButton(): Locator {
    return this.page.getByRole("button", { name: /Reorder|Adding.../ }).first()
  }

  cancelItemButton(): Locator {
    return this.page.getByRole("button", { name: /Cancel Item/ }).first()
  }

  cancelAllFromSellerButton(sellerName: string | RegExp): Locator {
    return this.page.getByRole("button", { name: /Cancel All Items from/ }).filter({ hasText: sellerName })
  }

  // -- Pagination (orders-pagination.tsx -> DashboardPagination) --

  // PaginationNext/Previous render as a plain <a> with no `href`
  // (src/components/ui/pagination.tsx) - without `href` an <a> carries no
  // implicit ARIA role, so getByRole("link"/"button") matches nothing; the
  // `aria-label` is the only reliable handle.
  get nextPageButton(): Locator {
    return this.page.getByLabel("Go to next page")
  }

  get previousPageButton(): Locator {
    return this.page.getByLabel("Go to previous page")
  }
}
