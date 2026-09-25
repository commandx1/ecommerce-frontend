import { makeActiveProductSearchItem } from "@/test/factories/product.factory"
import type { ApiMock } from "./fixtures/api-mock.fixture"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { VendorCreateProductPage, VendorProductsPage } from "./pages/vendor-products.page"

/**
 * `GET /api/products/active` is intentionally NOT registered by
 * products.mocks.ts (handler-literal response, no exported factory - see
 * that file's header comment). The create-product page's search box
 * (`productsAPI.searchActiveProducts`) hits it on every keystroke.
 * `openBlankForm` needs the "Can't find your product? Create new" link,
 * which only renders at the bottom of a NON-empty results list (see
 * product-editor/components/search/SearchResults.tsx) - a zero-result response shows a
 * different "No results found" panel with a "Create New Product" button.
 */
function registerCreateProductMocks(apiMock: ApiMock) {
  apiMock.on("GET", "/api/products/active", () => ({
    body: { content: [makeActiveProductSearchItem()], totalElements: 1, totalPages: 1 },
  }))
  // Details tab's Brand field (`BrandFilterDropdown`) fetches this on open - not registered by
  // products.mocks.ts (handler-literal response, no exported factory - see that file's header
  // comment, same reasoning as `/api/products/active` above).
  apiMock.on("GET", "/api/products/brands/search", () => ({
    body: {
      content: ["Acme Dental"],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    },
  }))
  registerAllMocks(apiMock)
}

const PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
)

test.describe("vendor products list", () => {
  test("shows the vendor's products", async ({ vendorPage, apiMock }) => {
    registerAllMocks(apiMock)

    const list = new VendorProductsPage(vendorPage)
    await list.goto()

    await expect(list.table).toBeVisible()
    await expect(list.rows.first()).toBeVisible()
  })

  test("inline Active/Inactive Radix Select change sends a PUT to /api/user-products/:id", async ({
    vendorPage,
    apiMock,
  }) => {
    // NOT registered by products.mocks.ts (only GET /api/user-products/:id
    // is) - register it here per the task brief's override instructions.
    apiMock.on("PUT", "/api/user-products/:id", ({ params }) => ({
      body: { id: params.id, active: false },
    }))
    registerAllMocks(apiMock)

    // K15 regression guard: this spec used to need a `**/_next/image**` stub here.
    // `images.loader: "custom"` makes Next 404 that endpoint on the standalone
    // production server, the row's <Image onError> then re-set `src` to the SAME
    // 404ing placeholder and re-fired forever - an infinite setState loop that tore
    // the whole table out of the DOM dozens of times a second ("detached from DOM,
    // retrying"). Both halves are fixed now (image-loader.ts no longer routes local
    // paths through the optimizer; the onError handler bails out when the fallback
    // is already set), so the stub is gone on purpose: if K15 comes back, this spec
    // must fail again instead of silently passing.

    const list = new VendorProductsPage(vendorPage)
    await list.goto()

    const row = list.rows.first()
    await list.editButton(row).click({ timeout: 5000 })

    // Radix Select renders its options into a portal - not inside the row.
    const trigger = list.statusSelectTrigger(row)
    await trigger.click()
    const inactiveOption = vendorPage.getByRole("option", { name: "Inactive" })
    await expect(inactiveOption).toBeVisible()
    await inactiveOption.click()

    const putRequest = vendorPage.waitForRequest(
      (req) => req.method() === "PUT" && /\/api\/user-products\/[^/]+$/.test(req.url()),
    )
    await list.saveButton(row).click()
    const request = await putRequest
    const body = request.postDataJSON() as { active: boolean }
    expect(body.active).toBe(false)
  })

  test("uploading a cover photo submits it as multipart FormData", async ({ vendorPage, apiMock }) => {
    registerCreateProductMocks(apiMock)

    const create = new VendorCreateProductPage(vendorPage)
    await create.openBlankForm()
    // Basic and Details must each pass validation before "Next" unlocks the following tab -
    // the form is now gated tab-by-tab (see this spec's header comment / task brief).
    await create.fillAllRequiredFieldsAndReachMedia()

    await create.coverPhotoInput.setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: PNG_BUFFER })

    const reviewRequest = vendorPage.waitForRequest(
      (req) => req.method() === "POST" && req.url().includes("/api/products/review"),
    )
    await create.submitButton.click()
    const request = await reviewRequest

    const raw = request.postDataBuffer()
    expect(raw).not.toBeNull()
    const contentType = request.headers()["content-type"] ?? ""
    expect(contentType).toContain("multipart/form-data")
    const boundaryMatch = contentType.match(/boundary=(.+)$/)
    expect(boundaryMatch).not.toBeNull()

    const bodyText = raw?.toString("utf-8") ?? ""
    // FormData field markers - verifies the multipart body actually carries
    // the "data" JSON part and the "coverPhoto" file part with our filename.
    expect(bodyText).toContain('name="data"')
    expect(bodyText).toContain('name="coverPhoto"; filename="cover.png"')
    expect(bodyText).toContain("Content-Type: image/png")

    await expect(
      vendorPage.locator("[data-sonner-toaster] li[data-sonner-toast]", { hasText: "Product submitted for review!" }),
    ).toBeVisible()
  })

  test("empty submission shows validation errors, then a corrected form publishes", async ({ vendorPage, apiMock }) => {
    registerCreateProductMocks(apiMock)

    const create = new VendorCreateProductPage(vendorPage)
    await create.openBlankForm()

    // Empty submission now means clicking "Next" while the (first) Basic tab is empty - the
    // header submit button is gone, and there's no way to reach Media (where the old submit
    // button lived) without first clearing Basic's own validation errors.
    await create.nextButton.click()
    await expect(vendorPage.getByText("Product name is required")).toBeVisible()
    await expect(vendorPage.getByText("Price is required")).toBeVisible()
    await expect(vendorPage.getByText("Stock is required")).toBeVisible()

    // Correct the form: fill every required field across all three tabs (Basic's other
    // required fields, all of Details, and Media's required cover photo) so the corrected
    // submission genuinely reaches the review endpoint instead of failing later validation.
    await create.fillAllRequiredFieldsAndReachMedia()
    await create.coverPhotoInput.setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: PNG_BUFFER })

    const reviewRequest = vendorPage.waitForRequest(
      (req) => req.method() === "POST" && req.url().includes("/api/products/review"),
    )
    await create.submitButton.click()
    const request = await reviewRequest
    expect(request.method()).toBe("POST")

    await expect(
      vendorPage.locator("[data-sonner-toaster] li[data-sonner-toast]", { hasText: "Product submitted for review!" }),
    ).toBeVisible()
  })
})
