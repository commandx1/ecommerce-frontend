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

  // -- Import Products modal (ImportDocumentsModal) --

  get openImportModalButton(): Locator {
    return this.page.getByRole("button", { name: "Import Products" })
  }

  get importModal(): Locator {
    return this.page.getByRole("dialog")
  }

  /** Hidden `<input type="file">` inside DocumentUploadForm's drop zone label. */
  get importFileInput(): Locator {
    return this.importModal.locator('input[type="file"]')
  }

  get importUploadButton(): Locator {
    return this.importModal.getByRole("button", { name: "Upload Document" })
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

  get shipmentFeeInput(): Locator {
    return this.page.getByLabel("Shipment Fee *")
  }

  get heavyShippingFeeInput(): Locator {
    return this.page.getByLabel("Heavy Shipping Fee *")
  }

  get fulfillmentPolicyInput(): Locator {
    return this.page.getByLabel("Fulfillment Policy *")
  }

  get descriptionInput(): Locator {
    return this.page.getByLabel("Detailed Description *")
  }

  get manufacturerCodeInput(): Locator {
    return this.page.getByLabel("Manufacturer Code *")
  }

  get manufacturerInput(): Locator {
    return this.page.getByLabel("Manufacturer *")
  }

  /** `<label htmlFor="brand">` targets the BrandFilterDropdown's trigger `<button id="brand">`. */
  get brandTrigger(): Locator {
    return this.page.getByLabel(/^Brand/)
  }

  get manufacturerSiteInput(): Locator {
    return this.page.getByLabel("Manufacturer Site Product Page *")
  }

  get weightInput(): Locator {
    return this.page.getByLabel("Weight *")
  }

  /** Bottom-of-form button: "Next" on Basic/Details, "Submit"/"Update Product"/"Resubmit for Review" on Media. */
  get nextButton(): Locator {
    return this.page.getByRole("button", { name: "Next" })
  }

  get previousButton(): Locator {
    return this.page.getByRole("button", { name: "Previous" })
  }

  get submitButton(): Locator {
    return this.page.getByRole("button", { name: /^(Submit|Update Product|Resubmit for Review)$/ })
  }

  /** Tab headers get an appended "N errors" a11y label once errored, so match by prefix. */
  get basicTabButton(): Locator {
    return this.page.getByRole("button", { name: /^Basic Information/ })
  }

  get detailsTabButton(): Locator {
    return this.page.getByRole("button", { name: /^Product Details/ })
  }

  get mediaTabButton(): Locator {
    return this.page.getByRole("button", { name: /^Media/ })
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

  /** Fills every required Basic-tab field; leaves the form on the Basic tab. Mirrors ProductEditorPage.validation.test.tsx's fillBasicTab. */
  async fillBasicTab(): Promise<void> {
    await this.nameInput.fill("Composite Kit")
    await this.skuInput.fill("SKU-1")
    await this.priceInput.fill("42")
    await this.stockInput.fill("7")
    await this.shipmentFeeInput.fill("5")
    await this.heavyShippingFeeInput.fill("3")
    // Fulfillment policy is a <select> of fixed day counts now, not free text. The option's label
    // is just the number; its value is the sentence getFulfillmentPolicyValue() builds, which is
    // what the form submits - so select by value, not by label.
    await this.fulfillmentPolicyInput.selectOption({ value: "Ships within 2 days" })
  }

  /**
   * Fills every required Details-tab field; leaves the form on the Details tab. Mirrors
   * ProductEditorPage.validation.test.tsx's fillDetailsTab, except Brand is a searchable dropdown here
   * (not a plain input) - opening it triggers `GET /api/products/brands/search`, which the
   * spec must register via `apiMock.on`.
   */
  async fillDetailsTab(): Promise<void> {
    await this.descriptionInput.fill("A great dental product")
    await this.manufacturerCodeInput.fill("MNF-1")
    await this.manufacturerInput.fill("MARK3")
    await this.brandTrigger.click()
    await this.page.getByRole("button", { name: "Acme Dental" }).click()
    await this.selectCategory()
    await this.manufacturerSiteInput.fill("https://example.com/products/item")
    // Reorder ID and Reference Number were dropped from this form; neither label exists any
    // more, so filling them timed out before the tab was ever complete.
    await this.weightInput.fill("1.5")
  }

  /**
   * Picks a leaf in the required Category field via the chain of dependent dropdowns
   * (Category 2 -> 3 -> 4) over the static category tree; level 1 "Dental Supplies" is fixed
   * and the tree covers levels 2-5.
   */
  async selectCategory(): Promise<void> {
    await this.page.getByRole("combobox", { name: "Category 2" }).click()
    await this.page.getByRole("option", { name: "Endodontic products" }).click()
    await this.page.getByRole("combobox", { name: "Category 3" }).click()
    await this.page.getByRole("option", { name: "Hand files-reamers-hedstroms" }).click()
    await this.page.getByRole("combobox", { name: "Category 4" }).click()
    await this.page.getByRole("option", { name: "K-Files" }).click()
  }

  /** Fills Basic then Details via the "Next" button, landing on the Media tab. */
  async fillAllRequiredFieldsAndReachMedia(): Promise<void> {
    await this.fillBasicTab()
    await this.nextButton.click()
    await this.fillDetailsTab()
    await this.nextButton.click()
  }
}
