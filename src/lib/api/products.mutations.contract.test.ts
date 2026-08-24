import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeProduct, makeVendorUserProduct } from "@/test/factories"
import type {
  BarcodeProduct,
  CreateProductData,
  CreateProductDetailsPayload,
  CreateUserProductPayload,
  ProductDetails,
  ProductVendorRequestData,
} from "./products"
import { productsAPI } from "./products"
import type { ApiRequestError } from "./request"
import { apiRequest } from "./request"

const productDetailsFixture: ProductDetails = {
  id: "pd-1",
  productId: "p-1",
  description: "Disposable mixing tips",
  manufacturerCode: "MK-1001",
  brand: "MARK3",
  packaging: "Box of 100",
  primaryMarket: "US",
  scent: "None",
  size: "Medium",
  type: "Yellow",
  sds: "sds-1",
}

const createProductData: CreateProductData = {
  name: "Intra Oral Mixing Tips",
  detailedName: "Intra Oral Mixing Tips Yellow 100/Pk",
  aboutProduct: "Disposable mixing tips",
  subCategoriesId: "sub-1",
  barcode: 123456789012,
  barcodeFormats: "UPC-A",
  active: true,
  description: "Disposable mixing tips",
  manufacturerCode: "MK-1001",
  brand: "MARK3",
  packaging: "Box of 100",
  primaryMarket: "US",
  distanceUnit: "cm",
  massUnit: "kg",
  scent: "None",
  size: "Medium",
  type: "Yellow",
  sds: "sds-1",
}

const reviewRequestData: ProductVendorRequestData = {
  name: "Intra Oral Mixing Tips",
  brand: "MARK3",
  skuCode: "SKU-1",
  price: 56,
  stock: 40,
  active: true,
}

let capturedCreateFormData: FormData | null = null
let capturedUpdateReviewFormData: FormData | null = null
let capturedUpdateProductBody: Record<string, unknown> | null = null
let capturedDeleteProductAuthHeader: string | null | undefined
let capturedCreateDetailsBody: Record<string, unknown> | null = null
let capturedUpdateDetailsBody: Record<string, unknown> | null = null
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
  capturedCreateFormData = null
  capturedUpdateReviewFormData = null
  capturedUpdateProductBody = null
  capturedDeleteProductAuthHeader = undefined
  capturedCreateDetailsBody = null
  capturedUpdateDetailsBody = null
  capturedCreateUserProductBody = null
  capturedUpdateUserProductBody = null
  capturedBulkDiscountBody = null
  capturedSearchTitleQuery = null

  server.use(
    http.post("*/api/products", async ({ request }) => {
      capturedCreateFormData = await request.formData()
      return HttpResponse.json(makeProduct())
    }),
    http.post("*/api/products/review", () => HttpResponse.json(makeProduct())),
    http.put("*/api/products/review/:id", async ({ request, params }) => {
      capturedUpdateReviewFormData = await request.formData()
      return HttpResponse.json(makeProduct({ id: String(params.id) }))
    }),
    http.put("*/api/products/:id", async ({ request, params }) => {
      capturedUpdateProductBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(makeProduct({ id: String(params.id) }))
    }),
    http.delete("*/api/products/:id", ({ request }) => {
      capturedDeleteProductAuthHeader = request.headers.get("authorization")
      return new HttpResponse(null, { status: 204 })
    }),
    http.post("*/api/products/details", async ({ request }) => {
      capturedCreateDetailsBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(productDetailsFixture)
    }),
    http.get("*/api/products/details/:id", ({ params }) =>
      HttpResponse.json({ ...productDetailsFixture, id: String(params.id) }),
    ),
    http.get("*/api/products/details/by-product/:productId", ({ params }) =>
      HttpResponse.json({ ...productDetailsFixture, productId: String(params.productId) }),
    ),
    http.put("*/api/products/details/:id", async ({ request }) => {
      capturedUpdateDetailsBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(productDetailsFixture)
    }),
    http.put("*/api/products/details/by-product/:productId", async ({ request }) => {
      capturedUpdateDetailsBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(productDetailsFixture)
    }),
    http.delete("*/api/products/details/:id", () => new HttpResponse(null, { status: 204 })),
    http.delete("*/api/products/details/by-product/:productId", () => new HttpResponse(null, { status: 204 })),
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

describe("productsAPI.createProduct contract", () => {
  it("sends the JSON payload as a 'data' field and no photo fields when none are given", async () => {
    await productsAPI.createProduct({ data: createProductData }, "token-1")

    expect(JSON.parse(capturedCreateFormData?.get("data") as string)).toEqual(createProductData)
    expect(capturedCreateFormData?.has("coverPhoto")).toBe(false)
    expect(capturedCreateFormData?.has("photos")).toBe(false)
  })

  // jsdom cannot actually transmit a `File`-bearing FormData over XHR in this test environment
  // (the request never completes), so this test asserts the exact multipart payload
  // `apiRequest.requestJson` is called with instead of round-tripping through MSW.
  it("attaches coverPhoto and each photo file to the outgoing multipart payload", async () => {
    const coverPhoto = new File(["cover"], "cover.png", { type: "image/png" })
    const photo1 = new File(["p1"], "p1.png", { type: "image/png" })
    const photo2 = new File(["p2"], "p2.png", { type: "image/png" })

    const spy = vi.spyOn(apiRequest, "requestJson").mockResolvedValueOnce(makeProduct())

    await productsAPI.createProduct({ data: createProductData, coverPhoto, photos: [photo1, photo2] }, "token-1")

    const sentFormData = spy.mock.calls[0]?.[0]?.data as FormData
    expect(JSON.parse(sentFormData.get("data") as string)).toEqual(createProductData)
    expect((sentFormData.get("coverPhoto") as File).name).toBe("cover.png")
    const photos = sentFormData.getAll("photos") as File[]
    expect(photos.map((p) => p.name)).toEqual(["p1.png", "p2.png"])

    spy.mockRestore()
  })

  it("rejects on 400 validation error", async () => {
    server.use(http.post("*/api/products", () => HttpResponse.json({ message: "Name is required" }, { status: 400 })))

    await expect(productsAPI.createProduct({ data: createProductData }, "token-1")).rejects.toThrow("Name is required")
  })

  it("rejects on 401 and marks authHandled", async () => {
    server.use(http.post("*/api/products", () => new HttpResponse(null, { status: 401 })))

    const error = await productsAPI.createProduct({ data: createProductData }, "token-1").catch((e) => e)
    expect((error as ApiRequestError).authHandled).toBe(true)
  })
})

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

  it("updateProductForReview rejects on 409 when the product is not in REJECTED status", async () => {
    server.use(
      http.put("*/api/products/review/:id", () =>
        HttpResponse.json({ message: "Product is not rejected" }, { status: 409 }),
      ),
    )

    await expect(productsAPI.updateProductForReview("p-1", { data: reviewRequestData }, "token-1")).rejects.toThrow(
      "Product is not rejected",
    )
  })
})

describe("productsAPI.updateProduct / deleteProduct contract", () => {
  it("updateProduct sends the exact payload shape", async () => {
    await productsAPI.updateProduct(
      "p-1",
      {
        name: "Updated name",
        detailedName: "Updated detailed name",
        aboutProduct: "Updated about",
        subCategoriesId: "sub-1",
        barcode: 123,
        barcodeFormats: "UPC-A",
        active: true,
      },
      "token-1",
    )

    expect(capturedUpdateProductBody).toEqual({
      name: "Updated name",
      detailedName: "Updated detailed name",
      aboutProduct: "Updated about",
      subCategoriesId: "sub-1",
      barcode: 123,
      barcodeFormats: "UPC-A",
      active: true,
    })
  })

  it("deleteProduct sends the bearer token and resolves on 204", async () => {
    await expect(productsAPI.deleteProduct("p-1", "token-1")).resolves.toBeUndefined()
    expect(capturedDeleteProductAuthHeader).toBe("Bearer token-1")
  })

  it("deleteProduct rejects on 403 (not the owner)", async () => {
    server.use(http.delete("*/api/products/:id", () => HttpResponse.json({ message: "Forbidden" }, { status: 403 })))

    await expect(productsAPI.deleteProduct("p-1", "token-1")).rejects.toThrow("Forbidden")
  })

  it("updateProduct rejects on 404 when the product no longer exists", async () => {
    server.use(http.put("*/api/products/:id", () => HttpResponse.json({ message: "Not found" }, { status: 404 })))

    await expect(
      productsAPI.updateProduct(
        "missing",
        {
          name: "n",
          detailedName: "d",
          aboutProduct: "a",
          subCategoriesId: "s",
          barcode: 1,
          barcodeFormats: "f",
          active: true,
        },
        "token-1",
      ),
    ).rejects.toThrow("Not found")
  })
})

describe("productsAPI product details CRUD contract", () => {
  it("createProductDetails sends the exact payload and returns the typed details", async () => {
    const payload: CreateProductDetailsPayload = {
      productId: "p-1",
      description: productDetailsFixture.description,
      manufacturerCode: productDetailsFixture.manufacturerCode,
      brand: productDetailsFixture.brand,
      packaging: productDetailsFixture.packaging,
      primaryMarket: productDetailsFixture.primaryMarket,
      scent: productDetailsFixture.scent,
      size: productDetailsFixture.size,
      type: productDetailsFixture.type,
      sds: productDetailsFixture.sds,
    }

    const result = await productsAPI.createProductDetails(payload, "token-1")

    expect(capturedCreateDetailsBody).toEqual(payload)
    expect(result).toEqual(productDetailsFixture)
  })

  it("getProductDetailsById returns the typed details", async () => {
    const result = await productsAPI.getProductDetailsById("pd-1")
    expect(result).toEqual({ ...productDetailsFixture, id: "pd-1" })
  })

  it("getProductDetailsByProductId returns the typed details", async () => {
    const result = await productsAPI.getProductDetailsByProductId("p-1")
    expect(result).toEqual({ ...productDetailsFixture, productId: "p-1" })
  })

  it("updateProductDetails sends only the given partial fields", async () => {
    await productsAPI.updateProductDetails("pd-1", { productId: "p-1", brand: "NewBrand" }, "token-1")
    expect(capturedUpdateDetailsBody).toEqual({ productId: "p-1", brand: "NewBrand" })
  })

  it("updateProductDetailsByProductId sends only the given partial fields", async () => {
    await productsAPI.updateProductDetailsByProductId("p-1", { productId: "p-1", size: "Large" }, "token-1")
    expect(capturedUpdateDetailsBody).toEqual({ productId: "p-1", size: "Large" })
  })

  it("deleteProductDetails and deleteProductDetailsByProductId resolve on 204", async () => {
    await expect(productsAPI.deleteProductDetails("pd-1", "token-1")).resolves.toBeUndefined()
    await expect(productsAPI.deleteProductDetailsByProductId("p-1", "token-1")).resolves.toBeUndefined()
  })

  it("getProductDetailsById rejects on 404", async () => {
    server.use(
      http.get("*/api/products/details/:id", () => HttpResponse.json({ message: "Not found" }, { status: 404 })),
    )

    await expect(productsAPI.getProductDetailsById("missing")).rejects.toThrow("Not found")
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

  it("createUserProduct rejects on 409 when the vendor already lists this product", async () => {
    server.use(
      http.post("*/api/user-products", () => HttpResponse.json({ message: "Already listed" }, { status: 409 })),
    )

    await expect(
      productsAPI.createUserProduct({ productId: "p-1", price: 1, discount: 0, stock: 1, active: true }, "token-1"),
    ).rejects.toThrow("Already listed")
  })

  it("deleteUserProduct rejects on 403", async () => {
    server.use(
      http.delete("*/api/user-products/:id", () => HttpResponse.json({ message: "Forbidden" }, { status: 403 })),
    )

    await expect(productsAPI.deleteUserProduct("up-1", "token-1")).rejects.toThrow("Forbidden")
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
