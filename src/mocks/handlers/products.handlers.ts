import { HttpResponse, http } from "msw"
import {
  makeActiveProductSearchItem,
  makeFavoriteProductItem,
  makeMyProductsPageResponse,
  makeProduct,
  makePublicProductsResponse,
  makeUserProductDetailResponse,
  makeUserProductsFilterResponse,
  makeVendorUserProduct,
} from "@/test/factories/product.factory"

// Reconstructed from the live MARK3 (1dc4e27b-c5ad-4959-909b-fc69a8800b1b) `Packaging` group:
// 4 rows sharing 2 values, each with its own name - the backend doesn't dedupe rows that share
// a value across different products (ambiguous variants). Exported so a test can opt into it
// with `server.use(http.post(..., () => HttpResponse.json(mark3VariantAttributesResponse)))`.
export const mark3VariantAttributesResponse = {
  attributes: [
    {
      attribute: "Packaging",
      values: [
        {
          value: "Package of 200 tips",
          selected: false,
          option: true,
          available: true,
          name: "MARK3 Mixing Tips 200/Pk. Disposable White Tips",
        },
        {
          value: "Package of 1500 syringe tips",
          selected: true,
          option: true,
          available: true,
          name: "MARK3 Mixing Tips 1500/Pk. Disposable White Tips",
        },
        {
          value: "Package of 1500 syringe tips",
          selected: false,
          option: false,
          available: true,
          name: "MARK3 Mixing Tips 1500/Pk. Disposable Multicolored Tips",
        },
        {
          value: "Package of 200 tips",
          selected: false,
          option: false,
          available: true,
          name: "MARK3 Mixing Tips 200/Pk. Disposable Multicolored Tips",
        },
      ],
    },
  ],
}

export const productsHandlers = [
  // ==================== Favorite products ====================
  http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json([])),

  http.get("*/backend-api/products/favorites", () => HttpResponse.json([makeFavoriteProductItem()])),

  http.post("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 200 })),

  http.delete("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 204 })),

  // ==================== Product search / listing (Next.js API proxy) ====================
  http.get("*/api/products/my-products", () => HttpResponse.json(makeMyProductsPageResponse())),

  http.get("*/api/products/active", () =>
    HttpResponse.json({
      content: [makeActiveProductSearchItem()],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }),
  ),

  http.get("*/api/products/brands/search", () =>
    HttpResponse.json({
      content: ["MARK3"],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }),
  ),

  http.get("*/api/products/brands", () => HttpResponse.json([{ name: "MARK3", count: 24 }])),

  http.get("*/api/products/manufacturers", () => HttpResponse.json([{ name: "MARK3", count: 24 }])),

  http.get("*/api/products/vendors", () => HttpResponse.json([{ id: "vendor-1", name: "Acme Dental", count: 12 }])),

  http.get("*/api/products/companies", () =>
    HttpResponse.json([{ id: "company-1", name: "Acme Dental Supplies", count: 12 }]),
  ),

  http.get("*/api/products/categories", () => HttpResponse.json([{ name: "Consumables", count: 45 }])),

  http.get("*/api/products/attributes", () =>
    HttpResponse.json([{ attributeName: "Color", values: [{ value: "Yellow", count: 10 }] }]),
  ),

  http.get("*/api/products/public", () => HttpResponse.json(makePublicProductsResponse())),

  // ==================== Variant attribute selector (hero) ====================
  // Every real backend failure here - including "this product simply has no variants" - is a
  // 400 (RuntimeException catch-all, no dedicated not-found status). Defaulting to 400 keeps
  // every unrelated product-detail test's hero free of surprise variant chips; a test that wants
  // the ambiguous MARK3 case overrides with `mark3VariantAttributesResponse` above.
  http.post("*/backend-api/products/variant-attributes", () =>
    HttpResponse.json({ message: "No variant of this product is currently available for sale." }, { status: 400 }),
  ),

  http.post("*/backend-api/products/variant-attributes/match", async ({ request }) => {
    const body = (await request.json()) as { productId?: string }
    return HttpResponse.json({ product: { id: body.productId ?? "matched-product" }, userProducts: [] })
  }),

  // ==================== Product review flow (vendor) ====================
  http.post("*/api/products/review", () => HttpResponse.json(makeProduct())),

  http.put("*/api/products/review/:id", ({ params }) => HttpResponse.json(makeProduct({ id: String(params.id) }))),

  http.post("*/api/products", () => HttpResponse.json(makeProduct())),

  // ==================== Product CRUD ====================
  http.get("*/api/products/:id/owner", ({ params }) => HttpResponse.json(makeProduct({ id: String(params.id) }))),

  http.get("*/api/products/:id", ({ params }) => HttpResponse.json(makeProduct({ id: String(params.id) }))),

  http.put("*/api/products/:id", ({ params }) => HttpResponse.json(makeProduct({ id: String(params.id) }))),

  http.delete("*/api/products/:id", () => new HttpResponse(null, { status: 204 })),

  // ==================== User products (vendor listings) ====================
  http.get("*/api/user-products/filter", () => HttpResponse.json(makeUserProductsFilterResponse())),

  http.get("*/api/user-products/brands", () => HttpResponse.json(["MARK3"])),

  http.post("*/api/user-products/bulk-discount", () => HttpResponse.json([makeVendorUserProduct()])),

  http.post("*/api/user-products", () => HttpResponse.json(makeVendorUserProduct())),

  http.get("*/api/user-products/:id", ({ params }) =>
    HttpResponse.json(makeUserProductDetailResponse({ id: String(params.id) })),
  ),

  http.get("*/api/user-products", () => HttpResponse.json([makeVendorUserProduct()])),
]
