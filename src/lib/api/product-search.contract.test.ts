import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { type SearchProduct, type SearchResponse, searchPublicProducts } from "./product-search"

function makeSearchProduct(overrides: Partial<SearchProduct> = {}): SearchProduct {
  return {
    productId: "p-1",
    productName: "Intra Oral Mixing Tips",
    barcode: "123456789012",
    coverPhotoPath: "/uploads/tips.png",
    secureCode: "SC-1",
    manufacturerCode: "MK-1001",
    reorderId: null,
    referanceNumber: null,
    userId: "vendor-1",
    price: 56,
    oldPrice: 70,
    discount: 20,
    stock: 40,
    ...overrides,
  }
}

function makeSearchResponse(overrides: Partial<SearchResponse> = {}): SearchResponse {
  return {
    content: [makeSearchProduct()],
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      sort: { empty: true, unsorted: true, sorted: false },
      offset: 0,
      unpaged: false,
      paged: true,
    },
    last: true,
    totalPages: 1,
    totalElements: 1,
    size: 20,
    number: 0,
    sort: { empty: true, unsorted: true, sorted: false },
    numberOfElements: 1,
    first: true,
    empty: false,
    ...overrides,
  }
}

let capturedQuery: URLSearchParams | null = null

/**
 * Captures the outgoing request so the assertions below can pin the exact wire contract.
 * Registered per test because the global setup resets handlers after every test case.
 */
beforeEach(() => {
  capturedQuery = null

  server.use(
    http.get("*/api/products/public-search", ({ request }) => {
      capturedQuery = new URL(request.url).searchParams
      return HttpResponse.json(makeSearchResponse())
    }),
  )
})

describe("searchPublicProducts contract", () => {
  it("returns the typed content array on a successful search", async () => {
    const results = await searchPublicProducts("mixing tips")

    expect(results).toHaveLength(1)
    expect(results[0]).toEqual(makeSearchProduct())
    expect(typeof results[0]?.price).toBe("number")
  })

  it("defaults page=0 and size=20, trims the query", async () => {
    await searchPublicProducts("  mixing tips  ")

    expect(capturedQuery?.get("search")).toBe("mixing tips")
    expect(capturedQuery?.get("page")).toBe("0")
    expect(capturedQuery?.get("size")).toBe("20")
  })

  it("serializes custom page and size", async () => {
    await searchPublicProducts("tips", 3, 5)

    expect(capturedQuery?.get("page")).toBe("3")
    expect(capturedQuery?.get("size")).toBe("5")
  })

  it("short-circuits to an empty array for an empty query without making a request", async () => {
    let requestMade = false
    server.use(
      http.get("*/api/products/public-search", () => {
        requestMade = true
        return HttpResponse.json(makeSearchResponse())
      }),
    )

    const results = await searchPublicProducts("   ")

    expect(results).toEqual([])
    expect(requestMade).toBe(false)
  })

  it("passes through special characters in the query", async () => {
    await searchPublicProducts("O'Brien & Sons #5 (dental)")

    expect(capturedQuery?.get("search")).toBe("O'Brien & Sons #5 (dental)")
  })

  it("passes through a long query string unmodified aside from trimming", async () => {
    const longQuery = "a".repeat(500)
    await searchPublicProducts(longQuery)

    expect(capturedQuery?.get("search")).toBe(longQuery)
  })

  it("tolerates an empty content array in the response", async () => {
    server.use(http.get("*/api/products/public-search", () => HttpResponse.json(makeSearchResponse({ content: [] }))))

    const results = await searchPublicProducts("nothing")
    expect(results).toEqual([])
  })

  it("tolerates a response missing the content field", async () => {
    server.use(
      http.get("*/api/products/public-search", () => {
        const { content: _content, ...rest } = makeSearchResponse()
        return HttpResponse.json(rest)
      }),
    )

    const results = await searchPublicProducts("nothing")
    expect(results).toEqual([])
  })

  it("swallows a 500 error and returns an empty array instead of throwing", async () => {
    server.use(http.get("*/api/products/public-search", () => new HttpResponse(null, { status: 500 })))

    await expect(searchPublicProducts("tips")).resolves.toEqual([])
  })

  it("swallows a 404 error and returns an empty array instead of throwing", async () => {
    server.use(http.get("*/api/products/public-search", () => new HttpResponse(null, { status: 404 })))

    await expect(searchPublicProducts("tips")).resolves.toEqual([])
  })

  it("swallows a network failure and returns an empty array instead of throwing", async () => {
    server.use(http.get("*/api/products/public-search", () => HttpResponse.error()))

    await expect(searchPublicProducts("tips")).resolves.toEqual([])
  })
})
