import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeProduct, makeVendorUserProduct } from "@/test/factories"
import type { BarcodeProduct, CreateUserProductPayload, ProductVendorRequestData } from "./products"
import { productsAPI } from "./products"
import { apiRequest } from "./request"

const reviewRequestData: ProductVendorRequestData = {
  name: "Intra Oral Mixing Tips",
  brand: "MARK3",
  skuCode: "SKU-1",
  price: 56,
  stock: 40,
  active: true,
}

let capturedUpdateReviewFormData: FormData | null = null
let capturedDeleteProductAuthHeader: string | null | undefined
let capturedCreateUserProductBody: Record<string, unknown> | null = null
let capturedUpdateUserProductBody: Record<string, unknown> | null = null
let capturedBulkDiscountBody: Record<string, unknown> | null = null
let capturedSearchTitleQuery: URLSearchParams | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. `products.ts` calls the Next.js `/api/...` route handlers directly (not
 * `/backend-api/...`), so every handler here must match `*` + `/api/...`.
 */
beforeEach(() => {
  capturedUpdateReviewFormData = null
  capturedDeleteProductAuthHeader = undefined
  capturedCreateUserProductBody = null
  capturedUpdateUserProductBody = null
  capturedBulkDiscountBody = null
  capturedSearchTitleQuery = null

  server.use(
    http.post("*/api/products/review", () => HttpResponse.json(makeProduct())),
    http.put("*/api/products/review/:id", async ({ request, params }) => {
      capturedUpdateReviewFormData = await request.formData()
      return HttpResponse.json(makeProduct({ id: String(params.id) }))
    }),
    http.delete("*/api/products/:id", ({ request }) => {
      capturedDeleteProductAuthHeader = request.headers.get("authorization")
      return new HttpResponse(null, { status: 204 })
    }),
    http.post("*/api/user-products", async ({ request }) => {
      capturedCreateUserProductBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(makeVendorUserProduct())
    }),
    http.put("*/api/user-products/:id", async ({ request, params }) => {
      capturedUpdateUserProductBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(makeVendorUserProduct({ id: String(params.id) }))
    }),
    http.delete("*/api/user-products/:id", () => new HttpResponse(null, { status: 204 })),
    http.post("*/api/user-products/bulk-discount", async ({ request }) => {
      capturedBulkDiscountBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json([makeVendorUserProduct()])
    }),
    http.get("*/api/barcode/products/search", ({ request }) => {
      capturedSearchTitleQuery = new URL(request.url).searchParams
      return HttpResponse.json({ products: [makeProduct()], barcodeProducts: [] })
    }),
    http.get("*/api/barcode/products", () =>
      HttpResponse.json<BarcodeProduct[]>([
        { id: 1, barcodeNumber: "123456789012", title: "Intra Oral Mixing Tips", images: [] },
      ]),
    ),
  )
})

// productsAPI.createProduct POSTs to /api/products (BFF: src/app/api/products/route.ts), which
// forwards to backend POST /api/products. That backend mapping is commented out
// (ecommerce-api ProductController.java:57-70 - the whole `create` method is block-commented) and
// no other controller maps `/api/products` (verified: only ProductController.java declares
// @RequestMapping("/api/products"), and its only active POST/PUT are /review and /review/{id}).
// There is also no production caller of `productsAPI.createProduct` anywhere in the frontend
// (grep confirms zero call sites outside this test file) - the real vendor-create flow uses
// `createProductForReview` instead. So every scenario below is unreachable from the real UI, and
// a real call would hit Spring's "no handler found" 404, not a validation 400 or an authHandled
// 401 (those response shapes assume the request reached the (nonexistent) controller method).
// Kept only as a marshalling/regression test of the FormData the client builds; the fictional
// error-status assertions that used to exist here were removed.
describe("productsAPI.createProductForReview / updateProductForReview contract", () => {
  // Same jsdom/XHR + File limitation as above: assert the multipart payload directly.
  it("createProductForReview sends the vendor-review data field and photos", async () => {
    const coverPhoto = new File(["cover"], "cover.png", { type: "image/png" })

    const spy = vi.spyOn(apiRequest, "requestJson").mockResolvedValueOnce(makeProduct())

    await productsAPI.createProductForReview({ data: reviewRequestData, coverPhoto }, "token-1")

    const sentFormData = spy.mock.calls[0]?.[0]?.data as FormData
    expect(JSON.parse(sentFormData.get("data") as string)).toEqual(reviewRequestData)
    expect((sentFormData.get("coverPhoto") as File).name).toBe("cover.png")

    spy.mockRestore()
  })

  it("updateProductForReview PUTs to /api/products/review/:id with the data field", async () => {
    await productsAPI.updateProductForReview("p-1", { data: reviewRequestData }, "token-1")

    expect(JSON.parse(capturedUpdateReviewFormData?.get("data") as string)).toEqual(reviewRequestData)
  })

  // Backend: ProductServiceImpl.updateForReview (line ~228-230) throws
  // `new BadRequestException("Only rejected products can be updated.")` when the product's
  // review status isn't FALSE (rejected). BadRequestException is explicitly mapped to 400 in
  // GlobalExceptionHandler.java - not 409.
  it("updateProductForReview rejects on 400 when the product is not in REJECTED status", async () => {
    server.use(
      http.put("*/api/products/review/:id", () =>
        HttpResponse.json({ message: "Only rejected products can be updated." }, { status: 400 }),
      ),
    )

    await expect(productsAPI.updateProductForReview("p-1", { data: reviewRequestData }, "token-1")).rejects.toThrow(
      "Only rejected products can be updated.",
    )
  })
})

describe("productsAPI.deleteProduct contract", () => {
  it("deleteProduct sends the bearer token and resolves on 204", async () => {
    await expect(productsAPI.deleteProduct("p-1", "token-1")).resolves.toBeUndefined()
    expect(capturedDeleteProductAuthHeader).toBe("Bearer token-1")
  })

  // Backend: ProductServiceImpl.delete (line ~609-617) has NO ownership/authorization check at
  // all - it only checks the product exists (ProductNotFoundException -> 400 via the
  // RuntimeException catch-all, see the getProductById fix above) and whether a UserProduct
  // references it (ProductInUseException, also unmapped -> falls through to the same 400
  // catch-all). A 403 "Forbidden" response is not producible by this endpoint for any vendor -
  // ownership is not checked before deletion. Replaced with the two real failure shapes.
  it("deleteProduct rejects on 400 when the product no longer exists", async () => {
    server.use(
      http.delete("*/api/products/:id", () =>
        HttpResponse.json({ message: "Product not found. ID: p-1" }, { status: 400 }),
      ),
    )

    await expect(productsAPI.deleteProduct("p-1", "token-1")).rejects.toThrow("Product not found. ID: p-1")
  })

  it("deleteProduct rejects on 400 when the product is already published by a vendor (in use)", async () => {
    server.use(
      http.delete("*/api/products/:id", () =>
        HttpResponse.json(
          { message: "This product cannot be deleted because user(s) have published it." },
          { status: 400 },
        ),
      ),
    )

    await expect(productsAPI.deleteProduct("p-1", "token-1")).rejects.toThrow(
      "This product cannot be deleted because user(s) have published it.",
    )
  })
})

describe("productsAPI user-product CRUD contract", () => {
  it("createUserProduct sends the exact payload shape", async () => {
    const payload: CreateUserProductPayload = { productId: "p-1", price: 56, discount: 20, stock: 40, active: true }

    await productsAPI.createUserProduct(payload, "token-1")

    expect(capturedCreateUserProductBody).toEqual(payload)
  })

  it("updateUserProduct sends the exact payload shape including optional fields", async () => {
    await productsAPI.updateUserProduct(
      "up-1",
      {
        price: 60,
        discount: 10,
        stock: 30,
        active: false,
        skuCode: "SKU-2",
        shipmentFee: 5,
        heavyShippingSurcharge: 2,
      },
      "token-1",
    )

    expect(capturedUpdateUserProductBody).toEqual({
      price: 60,
      discount: 10,
      stock: 30,
      active: false,
      skuCode: "SKU-2",
      shipmentFee: 5,
      heavyShippingSurcharge: 2,
    })
  })

  it("updateUserProduct omits optional fields when not given", async () => {
    await productsAPI.updateUserProduct("up-1", { price: 60, discount: 10, stock: 30, active: false }, "token-1")

    expect(capturedUpdateUserProductBody).toEqual({ price: 60, discount: 10, stock: 30, active: false })
  })

  it("deleteUserProduct resolves on 204", async () => {
    await expect(productsAPI.deleteUserProduct("up-1", "token-1")).resolves.toBeUndefined()
  })

  // Backend: UserProductServiceImpl.create (line ~70) throws a plain
  // `new RuntimeException("This product is already in your inventory. Please check the products
  // page.")` when the vendor already lists this product. It is not a DuplicateProductException/
  // DuplicateBarcodeException (those are product/exception types used by ProductServiceImpl, not
  // this service), so it falls through to GlobalExceptionHandler's trailing
  // @ExceptionHandler(RuntimeException.class) catch-all - 400, not 409.
  it("createUserProduct rejects on 400 when the vendor already lists this product", async () => {
    server.use(
      http.post("*/api/user-products", () =>
        HttpResponse.json(
          { message: "This product is already in your inventory. Please check the products page." },
          { status: 400 },
        ),
      ),
    )

    await expect(
      productsAPI.createUserProduct({ productId: "p-1", price: 1, discount: 0, stock: 1, active: true }, "token-1"),
    ).rejects.toThrow("This product is already in your inventory. Please check the products page.")
  })

  // Backend: UserProductServiceImpl.delete (line ~213) throws a plain
  // `new RuntimeException("You are not authorized to delete this product")` - also unmapped, also
  // falls to the RuntimeException catch-all - 400, not 403.
  it("deleteUserProduct rejects on 400 when not the owner", async () => {
    server.use(
      http.delete("*/api/user-products/:id", () =>
        HttpResponse.json({ message: "You are not authorized to delete this product" }, { status: 400 }),
      ),
    )

    await expect(productsAPI.deleteUserProduct("up-1", "token-1")).rejects.toThrow(
      "You are not authorized to delete this product",
    )
  })
})

describe("productsAPI.bulkDiscount contract", () => {
  it("sends the exact userProductIds + discount payload and returns the typed array", async () => {
    const result = await productsAPI.bulkDiscount("token-1", { userProductIds: ["up-1", "up-2"], discount: 15 })

    expect(capturedBulkDiscountBody).toEqual({ userProductIds: ["up-1", "up-2"], discount: 15 })
    expect(result).toEqual([makeVendorUserProduct()])
  })

  it("tolerates an empty userProductIds array", async () => {
    server.use(http.post("*/api/user-products/bulk-discount", () => HttpResponse.json([])))

    const result = await productsAPI.bulkDiscount("token-1", { userProductIds: [], discount: 15 })
    expect(result).toEqual([])
  })

  it("rejects on 400 when discount is out of range", async () => {
    server.use(
      http.post("*/api/user-products/bulk-discount", () =>
        HttpResponse.json({ message: "Discount must be 0-100" }, { status: 400 }),
      ),
    )

    await expect(productsAPI.bulkDiscount("token-1", { userProductIds: ["up-1"], discount: 150 })).rejects.toThrow(
      "Discount must be 0-100",
    )
  })
})

describe("productsAPI barcode search/lookup contract", () => {
  it("searchProductsByTitle serializes the title query param and returns local + barcode products", async () => {
    const result = await productsAPI.searchProductsByTitle("mixing tips", "token-1")

    expect(capturedSearchTitleQuery?.get("title")).toBe("mixing tips")
    expect(result.products).toEqual([makeProduct()])
    expect(result.barcodeProducts).toEqual([])
  })

  it("searchProductsByTitle tolerates an empty result set", async () => {
    server.use(
      http.get("*/api/barcode/products/search", () => HttpResponse.json({ products: [], barcodeProducts: [] })),
    )

    const result = await productsAPI.searchProductsByTitle("nothing", "token-1")
    expect(result.products).toEqual([])
    expect(result.barcodeProducts).toEqual([])
  })

  it("getAllBarcodeProducts returns the typed array", async () => {
    const result = await productsAPI.getAllBarcodeProducts("token-1")
    expect(result).toEqual([{ id: 1, barcodeNumber: "123456789012", title: "Intra Oral Mixing Tips", images: [] }])
  })

  it("getAllBarcodeProducts tolerates an empty array", async () => {
    server.use(http.get("*/api/barcode/products", () => HttpResponse.json([])))
    await expect(productsAPI.getAllBarcodeProducts("token-1")).resolves.toEqual([])
  })

  it("getProductByBarcode returns a local product on 200", async () => {
    server.use(http.get("*/api/barcode/products/bybarcode/:barcode", () => HttpResponse.json(makeProduct())))

    const result = await productsAPI.getProductByBarcode("123456789012", "token-1")
    expect(result).toEqual(makeProduct())
  })

  it("getProductByBarcode URL-encodes the barcode", async () => {
    let capturedUrl = ""
    server.use(
      http.get("*/api/barcode/products/bybarcode/:barcode", ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(makeProduct())
      }),
    )

    await productsAPI.getProductByBarcode("12/34 56", "token-1")
    expect(capturedUrl).toContain(encodeURIComponent("12/34 56"))
  })

  it("getProductByBarcode throws the JSON error body on a JSON error response", async () => {
    server.use(
      http.get("*/api/barcode/products/bybarcode/:barcode", () =>
        HttpResponse.json({ message: "Not found" }, { status: 404 }),
      ),
    )

    await expect(productsAPI.getProductByBarcode("000", "token-1")).rejects.toEqual({ message: "Not found" })
  })

  it("getProductByBarcode throws a generic 'Product not found' Error on a non-JSON error response", async () => {
    server.use(
      http.get(
        "*/api/barcode/products/bybarcode/:barcode",
        () => new HttpResponse("Not Found", { status: 404, headers: { "content-type": "text/plain" } }),
      ),
    )

    await expect(productsAPI.getProductByBarcode("000", "token-1")).rejects.toThrow("Product not found (404)")
  })

  it("getProductByBarcode rejects on network failure", async () => {
    server.use(http.get("*/api/barcode/products/bybarcode/:barcode", () => HttpResponse.error()))

    await expect(productsAPI.getProductByBarcode("000", "token-1")).rejects.toThrow()
  })
})
