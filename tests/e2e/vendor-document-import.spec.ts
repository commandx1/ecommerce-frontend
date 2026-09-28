import path from "node:path"
import { makeUserProductDetailResponse } from "@/test/factories/product.factory"
import type { ApiMock } from "./fixtures/api-mock.fixture"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { VendorProductsPage } from "./pages/vendor-products.page"

/**
 * Bulk product import via Excel doc - src/features/vendor-dashboard/products/import-documents/**.
 * Opened from VendorProductsPage's "Import Products" button (`page.openImportModal`).
 *
 * Endpoints, matched to their backend controllers/DTOs (ecommerce-api, read-only context here):
 *  - `POST /backend-api/products/documents/upload-and-import` (multipart) - `useDocumentUpload`'s
 *    `vendorDocumentsAPI.uploadDocument`. `ProductController.uploadAndImportExistingProducts`
 *    (`@RequestPart("file") MultipartFile file`) returns `VendorDocumentImportResponseDto`
 *    (documentId/success/message/acceptedCount/skippedCount/wrongCount/invalidRecordsFilePath) -
 *    mirrored 1:1 by `ImportResult` in src/lib/api/vendor-documents.ts.
 *  - `GET /backend-api/user-products/documents/:id/products` - `useDocumentProductsPanel`'s
 *    `vendorDocumentsAPI.getDocumentProducts`, rendered by `ImportResultView`'s
 *    `DocumentProductsPanel`/`DocumentProductsFilterPills` as the "Imported"/"Skipped"/"Failed"
 *    counts. `UserProductController`'s endpoint returns `DocumentProductsResponseDto`
 *    (documentId/products: `DocumentProductStatusDto[]`{status, product: `UserProductResponse`}
 *    /wrongRows) - mirrored by `DocumentProductsResponse`/`DocumentProductStatus`.
 *  - `GET /backend-api/products/documents` - `useDocumentHistory`'s `vendorDocumentsAPI.getDocuments`,
 *    the modal's "My Uploads" tab. `ProductController.getDocuments` returns
 *    `Page<VendorDocumentResponseDto>` (id/ownerId/filePath/approved/revisionRequested/
 *    revisionApproved/requestedEdits/revisedFilePath/invalidRecordsFilePath/createdDate/
 *    updatedDate/isDeleted) - mirrored by `VendorDocumentsResponse`/`VendorDocument`.
 *  - `GET /api/user-products/stats` (Next.js route, not `/backend-api/`) - `ProductStatsCards`'s
 *    `fetchUserProductStats`; no exported factory (handler-literal `ProductStats`), registered
 *    directly here the same way `products.mocks.ts`'s header comment does for its own
 *    handler-literal endpoints.
 */

const FIXTURE_PATH = path.join(__dirname, "fixtures", "sample-product-import.xlsx")

const DOCUMENT_ID = "doc-import-1"

const ACCEPTED_PRODUCT = makeUserProductDetailResponse({ id: "up-imported-1", productName: "Imported Bur Set" })
const SKIPPED_PRODUCT = makeUserProductDetailResponse({ id: "up-imported-2", productName: "Duplicate SKU Item" })

function registerDocumentImportMocks(apiMock: ApiMock) {
  registerAllMocks(apiMock)

  // ProductStatsCards - see this file's header comment for why it's registered directly.
  apiMock.on("GET", "/api/user-products/stats", () => ({
    body: { totalProducts: 5, activeProducts: 4, inactiveProducts: 1, outOfStockProducts: 0, lowStockProducts: 1 },
  }))

  apiMock.on("GET", "/backend-api/products/documents", () => ({
    body: {
      content: [],
      pageable: { pageNumber: 0, pageSize: 10 },
      totalPages: 1,
      totalElements: 0,
      last: true,
      first: true,
      numberOfElements: 0,
      size: 10,
      number: 0,
      empty: true,
    },
  }))

  apiMock.on("POST", "/backend-api/products/documents/upload-and-import", () => ({
    body: {
      documentId: DOCUMENT_ID,
      success: true,
      message: "2 of 3 rows imported. 1 row skipped.",
      acceptedCount: 1,
      skippedCount: 1,
      wrongCount: 0,
      invalidRecordsFilePath: null,
    },
  }))

  apiMock.on("GET", "/backend-api/user-products/documents/:id/products", () => ({
    body: {
      documentId: DOCUMENT_ID,
      products: [
        { status: "success", product: ACCEPTED_PRODUCT },
        { status: "skip", product: SKIPPED_PRODUCT },
      ],
      wrongRows: [],
    },
  }))
}

test.describe("vendor document import", () => {
  test("uploading a document sends a multipart request, shows accepted/skipped counts, and closing refetches the product list", async ({
    vendorPage,
    apiMock,
  }) => {
    registerDocumentImportMocks(apiMock)

    const listRequests: string[] = []
    const statsRequests: string[] = []
    vendorPage.on("request", (request) => {
      if (request.method() !== "GET") return
      if (request.url().includes("/api/user-products/filter")) listRequests.push(request.url())
      if (request.url().includes("/api/user-products/stats")) statsRequests.push(request.url())
    })

    const products = new VendorProductsPage(vendorPage)
    await products.goto()
    await expect(products.table).toBeVisible()

    await expect.poll(() => listRequests.length).toBeGreaterThanOrEqual(1)
    await expect.poll(() => statsRequests.length).toBeGreaterThanOrEqual(1)
    const listRequestsBeforeImport = listRequests.length
    const statsRequestsBeforeImport = statsRequests.length

    await products.openImportModalButton.click()
    // Two "Import Products" text nodes exist in the dialog (Modal's own sr-only DialogTitle, and
    // ImportDocumentsModal's own visible <h2>) - this subtitle is unique, and visible.
    await expect(products.importModal.getByText("Upload an Excel file to bulk-import products for review")).toBeVisible()

    await products.importFileInput.setInputFiles(FIXTURE_PATH)
    await expect(products.importModal.getByText("sample-product-import.xlsx")).toBeVisible()

    const uploadRequest = vendorPage.waitForRequest(
      (request) =>
        request.method() === "POST" && request.url().endsWith("/backend-api/products/documents/upload-and-import"),
    )
    await products.importUploadButton.click()
    const request = await uploadRequest

    const contentType = request.headers()["content-type"] ?? ""
    expect(contentType).toContain("multipart/form-data")
    const boundaryMatch = contentType.match(/boundary=(.+)$/)
    expect(boundaryMatch).not.toBeNull()
    const bodyText = request.postDataBuffer()?.toString("utf-8") ?? ""
    // VendorDocumentImportResponseDto's endpoint takes a single @RequestPart("file") - the
    // multipart body must carry exactly that field name and the fixture's filename.
    expect(bodyText).toContain('name="file"; filename="sample-product-import.xlsx"')

    // Accepted/skipped counts, from `VendorDocumentImportResponseDto`'s acceptedCount/skippedCount
    // via the toast `useDocumentUpload.handleUpload` raises for a partial import.
    await expect(products.toast).toContainText("1 accepted, 1 skipped, 0 failed")

    // Same counts, independently rendered by DocumentProductsFilterPills from the
    // `DocumentProductsResponseDto.products` statuses (the OTHER endpoint above).
    await expect(products.importModal.getByText("Imported Bur Set")).toBeVisible()
    const importedPill = products.importModal.locator("button", { hasText: "Imported" })
    await expect(importedPill.getByText("1", { exact: true })).toBeVisible()
    const skippedPill = products.importModal.locator("button", { hasText: "Skipped" })
    await expect(skippedPill.getByText("1", { exact: true })).toBeVisible()

    // The product list/stats behind the modal refetch as soon as the import accepts at least one
    // row (`useDocumentUpload.handleUpload`'s `invalidateQueries` for `queryKeys.vendor.products.all`,
    // gated on `acceptedCount > 0`) - VendorProductsPage stays mounted (just visually covered) under
    // the Radix Dialog overlay, so this fires well before the modal is ever closed; its own
    // doc-comment says as much ("without this its table, stat cards... keep showing pre-import data
    // until an unrelated refetch happens to land").
    await expect.poll(() => listRequests.length).toBeGreaterThan(listRequestsBeforeImport)
    await expect.poll(() => statsRequests.length).toBeGreaterThan(statsRequestsBeforeImport)

    // Closing the modal (Escape - Modal's `closeOnEscape` default) reveals that already-fresh
    // list/stats underneath rather than the pre-import snapshot.
    await vendorPage.keyboard.press("Escape")
    await expect(products.importModal).toBeHidden()
    await expect(products.table).toBeVisible()
  })
})
