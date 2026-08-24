import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { type DocumentProductsResponse, vendorDocumentsAPI } from "./vendor-documents"

const DOCUMENT_ID = "11111111-2222-3333-4444-555555555555"
const TOKEN = "test-token"

let capturedUrl: string | null = null
let capturedAuth: string | null = null

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "up-1",
    userId: "user-1",
    productId: "p-1",
    productName: "Composite Resin Kit",
    price: 129.5,
    oldPrice: 149.5,
    discount: 20,
    stock: 12,
    active: true,
    coverPhotoPath: "/uploads/kit.png",
    skuCode: "SKU-1",
    sellCount: 3,
    height: 1,
    length: 1,
    width: 1,
    distanceUnit: "cm",
    weight: 1,
    massUnit: "kg",
    shipmentFee: 0,
    ...overrides,
  }
}

const mixedResponse: DocumentProductsResponse = {
  documentId: DOCUMENT_ID,
  products: [
    { status: "success", product: makeProduct() },
    { status: "skip", product: makeProduct({ id: "up-2", skuCode: "SKU-2" }) },
  ],
  wrongRows: [{ Manufacturer_Code: "MC-9", Brand: "Acme", Status: "x" }],
}

beforeEach(() => {
  capturedUrl = null
  capturedAuth = null
})

function mockDocumentProducts(body: DocumentProductsResponse) {
  server.use(
    http.get("*/backend-api/user-products/documents/:documentId/products", ({ request }) => {
      capturedUrl = request.url
      capturedAuth = request.headers.get("Authorization")
      return HttpResponse.json(body)
    }),
  )
}

describe("vendorDocumentsAPI.getDocumentProducts contract", () => {
  it("calls the user-products document endpoint with the bearer token", async () => {
    mockDocumentProducts(mixedResponse)

    await vendorDocumentsAPI.getDocumentProducts(DOCUMENT_ID, TOKEN)

    expect(capturedUrl).toContain(`/backend-api/user-products/documents/${DOCUMENT_ID}/products`)
    expect(capturedAuth).toBe(`Bearer ${TOKEN}`)
  })

  it("parses a mixed success/skip/wrong response", async () => {
    mockDocumentProducts(mixedResponse)

    const result = await vendorDocumentsAPI.getDocumentProducts(DOCUMENT_ID, TOKEN)

    expect(result.documentId).toBe(DOCUMENT_ID)
    expect(result.products.map((entry) => entry.status)).toEqual(["success", "skip"])
    expect(result.products[0].product.skuCode).toBe("SKU-1")
    expect(result.wrongRows).toEqual([{ Manufacturer_Code: "MC-9", Brand: "Acme", Status: "x" }])
  })

  // A document without an invalid-records file is served from the original upload,
  // where the backend has no per-row status to report.
  it("tolerates a null status on every product", async () => {
    mockDocumentProducts({
      documentId: DOCUMENT_ID,
      products: [{ status: null, product: makeProduct() }],
      wrongRows: [],
    })

    const result = await vendorDocumentsAPI.getDocumentProducts(DOCUMENT_ID, TOKEN)

    expect(result.products[0].status).toBeNull()
    expect(result.wrongRows).toEqual([])
  })

  it("surfaces the backend error message instead of swallowing it", async () => {
    server.use(
      http.get("*/backend-api/user-products/documents/:documentId/products", () =>
        HttpResponse.json({ message: "Sheet not found: New Product Upload Template" }, { status: 500 }),
      ),
    )

    await expect(vendorDocumentsAPI.getDocumentProducts(DOCUMENT_ID, TOKEN)).rejects.toThrow(
      "Sheet not found: New Product Upload Template",
    )
  })
})
