import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeProduct, makePublicProductsResponse } from "@/test/factories"
import {
  getProductAttributeOptions,
  getProductBrandOptions,
  getProductCategoryOptions,
  getProductCompanyOptions,
  getProductManufacturerOptions,
  getProductVendorOptions,
  getPublicProducts,
} from "./public-products"

let capturedQuery: URLSearchParams | null = null
let capturedAuthHeader: string | null | undefined

/**
 * Captures the outgoing request so the assertions below can pin the exact wire contract.
 * Registered per test because the global setup resets handlers after every test case.
 */
beforeEach(() => {
  capturedQuery = null
  capturedAuthHeader = undefined

  server.use(
    http.get("*/api/products/public", ({ request }) => {
      const url = new URL(request.url)
      capturedQuery = url.searchParams
      capturedAuthHeader = request.headers.get("authorization")
      return HttpResponse.json(makePublicProductsResponse())
    }),
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
  )
})

describe("getPublicProducts contract", () => {
  it("returns the typed page response on success (no auth required)", async () => {
    const response = await getPublicProducts(0, 10, {})

    expect(response.content).toHaveLength(1)
    expect(response.content?.[0]).toEqual(makeProduct())
    expect(response.totalElements).toBe(1)
    expect(response.totalPages).toBe(1)
    expect(capturedAuthHeader).toBeNull()
  })

  it("serializes page and size", async () => {
    await getPublicProducts(2, 25, {})

    expect(capturedQuery?.get("page")).toBe("2")
    expect(capturedQuery?.get("size")).toBe("25")
  })

  it("serializes array filters as repeated query params", async () => {
    await getPublicProducts(0, 10, {
      brands: ["MARK3", "Dentsply"],
      manufacturers: ["MARK3"],
      categories: ["Consumables", "Impression"],
      vendorIds: ["vendor-1", "vendor-2"],
      attributes: ["Color:Yellow"],
    })

    expect(capturedQuery?.getAll("brands")).toEqual(["MARK3", "Dentsply"])
    expect(capturedQuery?.getAll("manufacturers")).toEqual(["MARK3"])
    expect(capturedQuery?.getAll("categories")).toEqual(["Consumables", "Impression"])
    expect(capturedQuery?.getAll("vendorIds")).toEqual(["vendor-1", "vendor-2"])
    expect(capturedQuery?.getAll("attributes")).toEqual(["Color:Yellow"])
  })

  it("serializes scalar filters and omits inStock when it is true (default)", async () => {
    await getPublicProducts(0, 10, {
      companyId: "company-1",
      minPrice: 10,
      maxPrice: 100,
      minRating: 3,
      inStock: true,
      sort: "price-asc",
    })

    expect(capturedQuery?.get("companyId")).toBe("company-1")
    expect(capturedQuery?.get("minPrice")).toBe("10")
    expect(capturedQuery?.get("maxPrice")).toBe("100")
    expect(capturedQuery?.get("minRating")).toBe("3")
    expect(capturedQuery?.has("inStock")).toBe(false)
    expect(capturedQuery?.get("sort")).toBe("price-asc")
  })

  it("sends inStock=false explicitly when filtering out-of-stock items", async () => {
    await getPublicProducts(0, 10, { inStock: false })

    expect(capturedQuery?.get("inStock")).toBe("false")
  })

  it("omits sort when it is the default best-match value", async () => {
    await getPublicProducts(0, 10, { sort: "best-match" })

    expect(capturedQuery?.has("sort")).toBe(false)
  })

  it("omits null/undefined optional filters entirely", async () => {
    await getPublicProducts(0, 10, { companyId: null, minPrice: null, maxPrice: null, minRating: null })

    expect(capturedQuery?.has("companyId")).toBe(false)
    expect(capturedQuery?.has("minPrice")).toBe(false)
    expect(capturedQuery?.has("maxPrice")).toBe(false)
    expect(capturedQuery?.has("minRating")).toBe(false)
  })

  it("tolerates an empty content array", async () => {
    server.use(http.get("*/api/products/public", () => HttpResponse.json(makePublicProductsResponse({ content: [] }))))

    const response = await getPublicProducts(0, 10, {})
    expect(response.content).toEqual([])
  })

  it("rejects with the fallback message on a 500 response", async () => {
    server.use(http.get("*/api/products/public", () => new HttpResponse(null, { status: 500 })))

    await expect(getPublicProducts(0, 10, {})).rejects.toThrow("Failed to fetch products")
  })

  it("rejects on a 400 response with the backend message", async () => {
    server.use(http.get("*/api/products/public", () => HttpResponse.json({ message: "Invalid page" }, { status: 400 })))

    await expect(getPublicProducts(-1, 10, {})).rejects.toThrow("Invalid page")
  })

  it("rejects on network failure", async () => {
    server.use(http.get("*/api/products/public", () => HttpResponse.error()))

    await expect(getPublicProducts(0, 10, {})).rejects.toThrow()
  })
})

describe("filter option endpoints contract", () => {
  it("getProductBrandOptions returns typed FilterOption[]", async () => {
    const options = await getProductBrandOptions()
    expect(options).toEqual([{ name: "MARK3", count: 24 }])
  })

  it("getProductManufacturerOptions returns typed FilterOption[]", async () => {
    const options = await getProductManufacturerOptions()
    expect(options).toEqual([{ name: "MARK3", count: 24 }])
  })

  it("getProductVendorOptions returns typed VendorOption[]", async () => {
    const options = await getProductVendorOptions()
    expect(options).toEqual([{ id: "vendor-1", name: "Acme Dental", count: 12 }])
  })

  it("getProductCompanyOptions returns typed CompanyOption[]", async () => {
    const options = await getProductCompanyOptions()
    expect(options).toEqual([{ id: "company-1", name: "Acme Dental Supplies", count: 12 }])
  })

  it("getProductCategoryOptions returns typed FilterOption[]", async () => {
    const options = await getProductCategoryOptions()
    expect(options).toEqual([{ name: "Consumables", count: 45 }])
  })

  it("getProductAttributeOptions returns typed AttributeGroup[]", async () => {
    const options = await getProductAttributeOptions()
    expect(options).toEqual([{ attributeName: "Color", values: [{ value: "Yellow", count: 10 }] }])
  })

  it("tolerates an empty array response for each filter option endpoint", async () => {
    server.use(
      http.get("*/api/products/brands", () => HttpResponse.json([])),
      http.get("*/api/products/manufacturers", () => HttpResponse.json([])),
      http.get("*/api/products/vendors", () => HttpResponse.json([])),
      http.get("*/api/products/companies", () => HttpResponse.json([])),
      http.get("*/api/products/categories", () => HttpResponse.json([])),
      http.get("*/api/products/attributes", () => HttpResponse.json([])),
    )

    await expect(getProductBrandOptions()).resolves.toEqual([])
    await expect(getProductManufacturerOptions()).resolves.toEqual([])
    await expect(getProductVendorOptions()).resolves.toEqual([])
    await expect(getProductCompanyOptions()).resolves.toEqual([])
    await expect(getProductCategoryOptions()).resolves.toEqual([])
    await expect(getProductAttributeOptions()).resolves.toEqual([])
  })

  it("swallows a 500 error and returns [] instead of throwing, for every filter endpoint", async () => {
    server.use(
      http.get("*/api/products/brands", () => new HttpResponse(null, { status: 500 })),
      http.get("*/api/products/manufacturers", () => new HttpResponse(null, { status: 500 })),
      http.get("*/api/products/vendors", () => new HttpResponse(null, { status: 500 })),
      http.get("*/api/products/companies", () => new HttpResponse(null, { status: 500 })),
      http.get("*/api/products/categories", () => new HttpResponse(null, { status: 500 })),
      http.get("*/api/products/attributes", () => new HttpResponse(null, { status: 500 })),
    )

    await expect(getProductBrandOptions()).resolves.toEqual([])
    await expect(getProductManufacturerOptions()).resolves.toEqual([])
    await expect(getProductVendorOptions()).resolves.toEqual([])
    await expect(getProductCompanyOptions()).resolves.toEqual([])
    await expect(getProductCategoryOptions()).resolves.toEqual([])
    await expect(getProductAttributeOptions()).resolves.toEqual([])
  })

  it("swallows a network failure and returns [] instead of throwing", async () => {
    server.use(http.get("*/api/products/brands", () => HttpResponse.error()))

    await expect(getProductBrandOptions()).resolves.toEqual([])
  })
})
