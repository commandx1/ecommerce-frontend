import type { Locator } from "@playwright/test"
import { BasePage } from "./base.page"

/** Vendor products list (`/vendor-dashboard/products`). See page.tsx (large, single-file). */
export class VendorProductsPage extends BasePage {
  readonly path = "/vendor-dashboard/products"

  get table(): Locator {
    return this.page.getByRole("table")
  }

  get rows(): Locator {
    return this.table.locator("tbody tr")
  }

  /** The pencil "Edit" icon-button for a row (title="Edit" -> accessible name via [title]). */
  editButton(row: Locator): Locator {
    return row.getByRole("button", { name: "Edit" })
  }

  /** Same button, relabeled "Save" once the row is in edit mode. */
  saveButton(row: Locator): Locator {
    return row.getByRole("button", { name: "Save" })
  }

  statusSelectTrigger(row: Locator): Locator {
    return row.getByRole("combobox")
  }
}

/** Vendor "create product" page (`/vendor-dashboard/products/create`). */
export class VendorCreateProductPage extends BasePage {
  readonly path = "/vendor-dashboard/products/create"

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/Search by barcode, name/)
  }

  get createNewProductButton(): Locator {
    return this.page.getByRole("button", { name: /Can't find your product\? Create new/ })
  }

  get nameInput(): Locator {
    return this.page.getByLabel(/Product Name/)
  }

  get priceInput(): Locator {
    return this.page.getByLabel("Price *")
  }

  get stockInput(): Locator {
    return this.page.getByLabel("Stock *")
  }

  get skuInput(): Locator {
    return this.page.getByLabel("SKU Code *")
  }

  get submitButton(): Locator {
    return this.page.getByRole("button", { name: /Create Product/ })
  }

  get mediaTabButton(): Locator {
    return this.page.getByRole("button", { name: "Media" })
  }

  get coverPhotoInput(): Locator {
    return this.page.locator("#coverPhotoInput")
  }

  async openBlankForm(searchQuery = "composite"): Promise<void> {
    await this.goto()
    await this.searchInput.fill(searchQuery)
    await this.createNewProductButton.click({ timeout: 5000 })
  }

  async fillRequiredFields(name: string, price: string, stock: string): Promise<void> {
    await this.nameInput.fill(name)
    await this.priceInput.fill(price)
    await this.stockInput.fill(stock)
  }
}
