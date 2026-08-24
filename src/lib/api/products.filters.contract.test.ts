import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import {
  makeActiveProductSearchItem,
  makeProduct,
  makeUserProductsFilterResponse,
  makeVendorUserProduct,
} from "@/test/factories"
import type { BarcodeLookupProduct, BarcodeProduct } from "./products"
import { productsAPI } from "./products"
import type { ApiRequestError } from "./request"

let capturedBrandsSearchQuery: URLSearchParams | null = null
let capturedActiveSearchQuery: URLSearchParams | null = null
let capturedFilterQuery: URLSearchParams | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. `products.ts` calls the Next.js `/api/...` route handlers directly (not
 * `/backend-api/...`), so every handler here must match `*` + `/api/...`.
 */
beforeEach(() => {
  capturedBrandsSearchQuery = null
  capturedActiveSearchQuery = null
  capturedFilterQuery = null

  server.use(
    http.get("*/api/products/brands/search", ({ request }) => {
      capturedBrandsSearchQuery = new URL(request.url).searchParams
      return HttpResponse.json({
        content: ["MARK3"],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
        numberOfElements: 1,
        first: true,
        last: true,
        empty: false,
      })
    }),
    http.get("*/api/products/active", ({ request }) => {
      capturedActiveSearchQuery = new URL(request.url).searchParams
      return HttpResponse.json({
        content: [makeActiveProductSearchItem()],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
        numberOfElements: 1,
        first: true,
        last: true,
        empty: false,
      })
    }),
    http.get("*/api/user-products/filter", ({ request }) => {
      capturedFilterQuery = new URL(request.url).searchParams
      return HttpResponse.json(makeUserProductsFilterResponse())
    }),
    http.get("*/api/user-products/brands", () => HttpResponse.json(["MARK3", "Dentsply"])),
  )
})

describe("productsAPI.searchBrands contract", () => {
  it("returns the typed page and defaults page=0, size=20", async () => {
    const result = await productsAPI.searchBrands({ search: "MAR" }, "token-1")

    expect(capturedBrandsSearchQuery?.get("search")).toBe("MAR")
    expect(capturedBrandsSearchQuery?.get("page")).toBe("0")
    expect(capturedBrandsSearchQuery?.get("size")).toBe("20")
    expect(result.content).toEqual(["MARK3"])
  })

  it("serializes explicit page/size", async () => {
    await productsAPI.searchBrands({ search: "MAR", page: 3, size: 5 }, "token-1")

    expect(capturedBrandsSearchQuery?.get("page")).toBe("3")
    expect(capturedBrandsSearchQuery?.get("size")).toBe("5")
  })

  it("tolerates an empty content array", async () => {
    server.use(
      http.get("*/api/products/brands/search", () =>
        HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 20,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true,
        }),
      ),
    )

    const result = await productsAPI.searchBrands({ search: "zzz" }, "token-1")
    expect(result.content).toEqual([])
  })

  it("rejects on 500", async () => {
    server.use(http.get("*/api/products/brands/search", () => new HttpResponse(null, { status: 500 })))

    await expect(productsAPI.searchBrands({ search: "MAR" }, "token-1")).rejects.toThrow("Failed to search brands")
  })
})

describe("productsAPI.searchActiveProducts contract", () => {
  it("returns the typed autocomplete page and defaults page=0, size=10", async () => {
    const result = await productsAPI.searchActiveProducts({ search: "tips" }, "token-1")

    expect(capturedActiveSearchQuery?.get("search")).toBe("tips")
    expect(capturedActiveSearchQuery?.get("page")).toBe("0")
    expect(capturedActiveSearchQuery?.get("size")).toBe("10")
    expect(capturedActiveSearchQuery?.has("brand")).toBe(false)
    expect(result.content[0]).toEqual(makeActiveProductSearchItem())
  })

  it("includes the brand filter only when given (and drops it when null)", async () => {
    await productsAPI.searchActiveProducts({ search: "tips", brand: "MARK3" }, "token-1")
    expect(capturedActiveSearchQuery?.get("brand")).toBe("MARK3")

    await productsAPI.searchActiveProducts({ search: "tips", brand: null }, "token-1")
    expect(capturedActiveSearchQuery?.has("brand")).toBe(false)
  })

  it("tolerates an empty result set", async () => {
    server.use(
      http.get("*/api/products/active", () =>
        HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true,
        }),
      ),
    )

    const result = await productsAPI.searchActiveProducts({ search: "nothing" }, "token-1")
    expect(result.content).toEqual([])
  })

  it("rejects on network failure", async () => {
    server.use(http.get("*/api/products/active", () => HttpResponse.error()))

    await expect(productsAPI.searchActiveProducts({ search: "tips" }, "token-1")).rejects.toThrow()
  })
})

describe("productsAPI.getUserProductBrands contract", () => {
  it("returns the typed brand array", async () => {
    const result = await productsAPI.getUserProductBrands("token-1")
    expect(result).toEqual(["MARK3", "Dentsply"])
  })

  it("tolerates an empty array", async () => {
    server.use(http.get("*/api/user-products/brands", () => HttpResponse.json([])))
    await expect(productsAPI.getUserProductBrands("token-1")).resolves.toEqual([])
  })

  it("rejects on 401 and marks authHandled", async () => {
    server.use(http.get("*/api/user-products/brands", () => new HttpResponse(null, { status: 401 })))

    const error = await productsAPI.getUserProductBrands("expired").catch((e) => e)
    expect((error as ApiRequestError).status).toBe(401)
    expect((error as ApiRequestError).authHandled).toBe(true)
  })
})

describe("productsAPI.filterUserProducts contract", () => {
  it("serializes type/page/size and treats page as 0-indexed (pass-through, not remapped)", async () => {
    await productsAPI.filterUserProducts("token-1", "ACTIVE", 2, 25)

    expect(capturedFilterQuery?.get("type")).toBe("ACTIVE")
    expect(capturedFilterQuery?.get("page")).toBe("2")
    expect(capturedFilterQuery?.get("size")).toBe("25")
  })

  it("defaults page=0, size=10 when not given", async () => {
    await productsAPI.filterUserProducts("token-1", "TOTAL")

    expect(capturedFilterQuery?.get("page")).toBe("0")
    expect(capturedFilterQuery?.get("size")).toBe("10")
  })

  it("serializes sortBy, sortDir, search, howManySoldDay, userProductId and brand only when given", async () => {
    await productsAPI.filterUserProducts("token-1", "LOW_STOCK", 0, 10, "PRICE", "asc", "tips", 30, "up-1", "MARK3")

    expect(capturedFilterQuery?.get("sortBy")).toBe("PRICE")
    expect(capturedFilterQuery?.get("sortDir")).toBe("asc")
    expect(capturedFilterQuery?.get("search")).toBe("tips")
    expect(capturedFilterQuery?.get("howManySoldDay")).toBe("30")
    expect(capturedFilterQuery?.get("userProductId")).toBe("up-1")
    expect(capturedFilterQuery?.get("brand")).toBe("MARK3")
  })

  it("omits sortBy/sortDir/search/howManySoldDay/userProductId/brand when undefined", async () => {
    await productsAPI.filterUserProducts("token-1", "TOTAL")

    expect(capturedFilterQuery?.has("sortBy")).toBe(false)
    expect(capturedFilterQuery?.has("sortDir")).toBe(false)
    expect(capturedFilterQuery?.has("search")).toBe(false)
    expect(capturedFilterQuery?.has("howManySoldDay")).toBe(false)
    expect(capturedFilterQuery?.has("userProductId")).toBe(false)
    expect(capturedFilterQuery?.has("brand")).toBe(false)
  })

  it("sends an explicit empty search string when search is the empty string", async () => {
    await productsAPI.filterUserProducts("token-1", "TOTAL", 0, 10, undefined, undefined, "")

    expect(capturedFilterQuery?.get("search")).toBe("")
  })

  it("returns the page response as-is when the backend already returns the pagination shape", async () => {
    const result = await productsAPI.filterUserProducts("token-1", "ACTIVE")
    expect(result).toEqual(makeUserProductsFilterResponse())
  })

  it("wraps a bare array response into a synthesized pagination object", async () => {
    server.use(http.get("*/api/user-products/filter", () => HttpResponse.json([makeVendorUserProduct()])))

    const result = await productsAPI.filterUserProducts("token-1", "ACTIVE", 0, 10)

    expect(result).toEqual({
      content: [makeVendorUserProduct()],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 10,
    })
  })

  it("tolerates an empty array response", async () => {
    server.use(http.get("*/api/user-products/filter", () => HttpResponse.json([])))

    const result = await productsAPI.filterUserProducts("token-1", "ACTIVE", 0, 10)
    expect(result.content).toEqual([])
    expect(result.totalElements).toBe(0)
  })

  it("parses an object response keyed by 'userProducts' instead of 'content'", async () => {
    server.use(
      http.get("*/api/user-products/filter", () =>
        HttpResponse.json({
          userProducts: [makeVendorUserProduct()],
          totalElements: 1,
          totalPages: 1,
          page: 0,
          size: 10,
        }),
      ),
    )

    const result = await productsAPI.filterUserProducts("token-1", "ACTIVE")
    expect(result.content).toEqual([makeVendorUserProduct()])
  })

  it("parses an object response keyed by 'items' instead of 'content'", async () => {
    server.use(
      http.get("*/api/user-products/filter", () =>
        HttpResponse.json({ items: [makeVendorUserProduct()], total: 1, size: 10, page: 0 }),
      ),
    )

    const result = await productsAPI.filterUserProducts("token-1", "ACTIVE")
    expect(result.content).toEqual([makeVendorUserProduct()])
    expect(result.totalElements).toBe(1)
  })

  it("parses a nested { data: {...} } envelope", async () => {
    server.use(
      http.get("*/api/user-products/filter", () =>
        HttpResponse.json({
          data: { content: [makeVendorUserProduct()], totalElements: 1, totalPages: 1, page: 0, size: 10 },
        }),
      ),
    )

    const result = await productsAPI.filterUserProducts("token-1", "ACTIVE")
    expect(result.content).toEqual([makeVendorUserProduct()])
  })

  it("throws an Error with the response status when the backend returns a non-2xx status", async () => {
    server.use(
      http.get("*/api/user-products/filter", () => HttpResponse.json({ message: "Bad filter" }, { status: 400 })),
    )

    const error = await productsAPI.filterUserProducts("token-1", "ACTIVE").catch((e) => e)
    expect(error).toEqual({ message: "Bad filter", status: 400 })
  })

  it("throws a generic status-based error when the error body has no message", async () => {
    server.use(http.get("*/api/user-products/filter", () => new HttpResponse(null, { status: 500 })))

    const error = await productsAPI.filterUserProducts("token-1", "ACTIVE").catch((e) => e)
    expect(error).toMatchObject({ status: 500 })
  })

  it("throws 'Invalid user product filter response' when the payload shape is unrecognized", async () => {
    server.use(http.get("*/api/user-products/filter", () => HttpResponse.json({ unexpected: true })))

    await expect(productsAPI.filterUserProducts("token-1", "ACTIVE")).rejects.toThrow(
      "Invalid user product filter response",
    )
  })
})

describe("productsAPI.normalizeActiveProductSearchItem (pure helper)", () => {
  it("normalizes a full item, proxying the cover photo through getFullImageUrl", () => {
    const item = makeActiveProductSearchItem()
    const normalized = productsAPI.normalizeActiveProductSearchItem(item)

    expect(normalized.id).toBe(item.id)
    expect(normalized.title).toBe(item.name)
    expect(normalized.brand).toBe("MARK3")
    expect(normalized.source).toBe("local")
    expect(normalized.images).toEqual(["/api/images/uploads/tips.png"])
  })

  it("tolerates null coverPhotoPath/brand/manufacturer/manufacturerCode", () => {
    const item = makeActiveProductSearchItem({
      coverPhotoPath: null,
      brand: null,
      manufacturer: null,
      manufacturerCode: null,
    })
    const normalized = productsAPI.normalizeActiveProductSearchItem(item)

    expect(normalized.images).toEqual([])
    expect(normalized.brand).toBeUndefined()
  })
})

describe("productsAPI.normalizeSearchResults (pure helper)", () => {
  it("normalizes local products, deriving images from coverPhotoPath + photoPhats", () => {
    const product = makeProduct()
    const normalized = productsAPI.normalizeSearchResults({ products: [product], barcodeProducts: [] })

    expect(normalized).toHaveLength(1)
    expect(normalized[0]).toMatchObject({ id: "p-1", source: "local", title: product.name })
    expect(normalized[0]?.images).toContain("/api/images/uploads/tips.png")
  })

  it("falls back to legacy comma-separated photoPaths when coverPhotoPath/photoPhats are absent", () => {
    const product = makeProduct({
      coverPhotoPath: undefined,
      photoPhats: undefined,
      photoPaths: "/uploads/a.png,/uploads/b.png",
    })
    const normalized = productsAPI.normalizeSearchResults({ products: [product], barcodeProducts: [] })

    expect(normalized[0]?.images).toEqual(["/api/images/uploads/a.png", "/api/images/uploads/b.png"])
  })

  it("normalizes barcode-lookup products", () => {
    const barcodeProduct: BarcodeLookupProduct = {
      barcode_number: "999",
      title: "External Product",
      brand: "ExtBrand",
      category: "Consumables",
      images: ["https://example.com/x.png"],
    }
    const normalized = productsAPI.normalizeSearchResults({ products: [], barcodeProducts: [barcodeProduct] })

    expect(normalized).toEqual([
      {
        id: "999",
        barcode: "999",
        title: "External Product",
        brand: "ExtBrand",
        category: "Consumables",
        images: ["https://example.com/x.png"],
        source: "barcode_lookup",
        originalData: barcodeProduct,
      },
    ])
  })

  it("tolerates an empty products/barcodeProducts payload", () => {
    const normalized = productsAPI.normalizeSearchResults({ products: [], barcodeProducts: [] })
    expect(normalized).toEqual([])
  })
})

describe("productsAPI.normalizeBarcodeResult (pure helper)", () => {
  it("normalizes a BarcodeLookupProduct (has barcode_number)", () => {
    const product: BarcodeLookupProduct = { barcode_number: "111", title: "Lookup item", images: [] }
    const normalized = productsAPI.normalizeBarcodeResult(product)
    expect(normalized.source).toBe("barcode_lookup")
    expect(normalized.id).toBe("111")
  })

  it("normalizes a BarcodeProduct (has barcodeNumber)", () => {
    const product: BarcodeProduct = { id: 5, barcodeNumber: "222", title: "Saved lookup", images: [] }
    const normalized = productsAPI.normalizeBarcodeResult(product)
    expect(normalized.source).toBe("barcode_lookup")
    expect(normalized.id).toBe("5")
    expect(normalized.barcode).toBe("222")
  })

  it("normalizes a local Product (neither barcode field)", () => {
    const product = makeProduct()
    const normalized = productsAPI.normalizeBarcodeResult(product)
    expect(normalized.source).toBe("local")
    expect(normalized.id).toBe("p-1")
  })
})
