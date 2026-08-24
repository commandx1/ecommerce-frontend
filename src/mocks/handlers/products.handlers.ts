import { HttpResponse, http } from "msw"
import {
  makeActiveProductSearchItem,
  makeMyProductsPageResponse,
  makeProduct,
  makePublicProductsResponse,
  makeUserProductDetailResponse,
  makeUserProductsFilterResponse,
  makeVendorUserProduct,
} from "@/test/factories/product.factory"

export const productsHandlers = [
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
