import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { BACKEND, createCapture, record } from "@/test/route-harness"
import { getListingPageData } from "./get-listing-page-data"
import type { ParsedListingSearchParams } from "./parse-listing-search-params"

/**
 * The listing page fans out six server-side fetches in a single `Promise.all`. The five filter
 * facets (brands, manufacturers, categories, vendors, attributes) degrade gracefully — each
 * fetcher catches internally and resolves to `[]` on failure, so a facet outage never takes down
 * the whole page. The product-list call (`getPublicProducts`) is different: it is NOT caught here,
 * so a failure rejects the whole `Promise.all` and propagates up to the page, which shows the
 * user an error screen instead of a silently empty grid (product decision, 3 Sep 2026).
 */

const PRODUCTS = `${BACKEND}/api/products/public`
const BRANDS = `${BACKEND}/api/products/brands`
const MANUFACTURERS = `${BACKEND}/api/products/manufacturers`
const CATEGORIES = `${BACKEND}/api/products/categories`
const VENDORS = `${BACKEND}/api/products/vendors`
const ATTRIBUTES = `${BACKEND}/api/products/attributes`

const params = (overrides: Partial<ParsedListingSearchParams> = {}): ParsedListingSearchParams => ({
  displayPage: 1,
  pageSize: 10,
  apiPage: 0,
  sort: "best-match",
  brands: [],
  manufacturers: [],
  categories: [],
  vendors: [],
  minPrice: null,
  maxPrice: null,
  minRating: null,
  inStock: true,
  attributes: [],
  companyId: null,
  search: null,
  ...overrides,
})

const productPage = { content: [{ id: "p-1" }], totalElements: 42, totalPages: 5 }

function stubAll() {
  server.use(
    http.get(PRODUCTS, () => HttpResponse.json(productPage)),
    http.get(BRANDS, () => HttpResponse.json([{ name: "MARK3", count: 2 }])),
    http.get(MANUFACTURERS, () => HttpResponse.json([{ name: "3M", count: 1 }])),
    http.get(CATEGORIES, () => HttpResponse.json([{ name: "Consumables", count: 3 }])),
    http.get(VENDORS, () => HttpResponse.json([{ id: "v-1", name: "Acme", count: 4 }])),
    http.get(ATTRIBUTES, () => HttpResponse.json([{ attributeName: "Shade", values: [{ value: "A2", count: 1 }] }])),
  )
}

describe("getListingPageData — happy path", () => {
  it("returns the product page and every facet in one shot", async () => {
    stubAll()

    const data = await getListingPageData(params())

    expect(data.products).toEqual([{ id: "p-1" }])
    expect(data.totalElements).toBe(42)
    expect(data.totalPages).toBe(5)
    expect(data.brands).toEqual([{ name: "MARK3", count: 2 }])
    expect(data.manufacturers).toEqual([{ name: "3M", count: 1 }])
    expect(data.categories).toEqual([{ name: "Consumables", count: 3 }])
    expect(data.vendors).toEqual([{ id: "v-1", name: "Acme", count: 4 }])
    expect(data.attributeGroups).toEqual([{ attributeName: "Shade", values: [{ value: "A2", count: 1 }] }])
  })

  it("translates the parsed search params into the products query string", async () => {
    const captured = createCapture()
    stubAll()
    server.use(
      http.get(PRODUCTS, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(productPage)
      }),
    )

    await getListingPageData(
      params({
        apiPage: 2,
        pageSize: 24,
        sort: "price-asc",
        brands: ["MARK3", "3M"],
        manufacturers: ["Kerr"],
        categories: ["Consumables"],
        vendors: ["v-1"],
        attributes: ["Shade:A2"],
        minPrice: 10,
        maxPrice: 99,
        minRating: 4,
        inStock: false,
        companyId: "c-9",
      }),
    )

    const query = new URL(captured.url ?? "").searchParams
    expect(query.get("page")).toBe("2")
    expect(query.get("size")).toBe("24")
    expect(query.get("sort")).toBe("price-asc")
    expect(query.getAll("brands")).toEqual(["MARK3", "3M"])
    expect(query.getAll("manufacturers")).toEqual(["Kerr"])
    expect(query.getAll("categories")).toEqual(["Consumables"])
    expect(query.getAll("vendorIds")).toEqual(["v-1"])
    expect(query.getAll("attributes")).toEqual(["Shade:A2"])
    expect(query.get("minPrice")).toBe("10")
    expect(query.get("maxPrice")).toBe("99")
    expect(query.get("minRating")).toBe("4")
    expect(query.get("inStock")).toBe("false")
    expect(query.get("companyId")).toBe("c-9")
  })

  it("forwards the parsed search term to getPublicProducts as `search`", async () => {
    const captured = createCapture()
    stubAll()
    server.use(
      http.get(PRODUCTS, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(productPage)
      }),
    )

    await getListingPageData(params({ search: "implant" }))

    const query = new URL(captured.url ?? "").searchParams
    expect(query.get("search")).toBe("implant")
  })

  it("omits `search` entirely when there is no search term", async () => {
    const captured = createCapture()
    stubAll()
    server.use(
      http.get(PRODUCTS, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(productPage)
      }),
    )

    await getListingPageData(params({ search: null }))

    const query = new URL(captured.url ?? "").searchParams
    expect(query.has("search")).toBe(false)
  })

  it("omits the default sort and the in-stock flag when they carry no information", async () => {
    const captured = createCapture()
    stubAll()
    server.use(
      http.get(PRODUCTS, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(productPage)
      }),
    )

    await getListingPageData(params({ sort: "best-match", inStock: true }))

    const query = new URL(captured.url ?? "").searchParams
    expect(query.has("sort")).toBe(false)
    expect(query.has("inStock")).toBe(false)
    expect(query.has("companyId")).toBe(false)
  })

  it("issues all six requests in parallel rather than in sequence", async () => {
    const started: number[] = []
    const mark = () => {
      started.push(Date.now())
    }
    server.use(
      http.get(PRODUCTS, () => {
        mark()
        return HttpResponse.json(productPage)
      }),
      http.get(BRANDS, () => {
        mark()
        return HttpResponse.json([])
      }),
      http.get(MANUFACTURERS, () => {
        mark()
        return HttpResponse.json([])
      }),
      http.get(CATEGORIES, () => {
        mark()
        return HttpResponse.json([])
      }),
      http.get(VENDORS, () => {
        mark()
        return HttpResponse.json([])
      }),
      http.get(ATTRIBUTES, () => {
        mark()
        return HttpResponse.json([])
      }),
    )

    await getListingPageData(params())

    expect(started).toHaveLength(6)
    expect(Math.max(...started) - Math.min(...started)).toBeLessThan(500)
  })
})

describe("getListingPageData — empty results", () => {
  it("normalises a page with no content and no totals to empty/1", async () => {
    stubAll()
    server.use(http.get(PRODUCTS, () => HttpResponse.json({})))

    const data = await getListingPageData(params())

    expect(data.products).toEqual([])
    expect(data.totalElements).toBe(0)
    // A catalogue with nothing in it still reports one page, so the pager renders "1 of 1".
    expect(data.totalPages).toBe(1)
  })

  // `content || []` only catches null/undefined. A malformed 200 carrying a wrong-typed truthy
  // value passes straight through it and reaches .map() in the grid, which takes the whole
  // listing page down to an error boundary (infra note #26 - the same root pattern found in
  // twelve other modules this week).
  it.each([
    ["an object", { nope: true }],
    ["a string", "not-a-page"],
    ["a number", 7],
    ["null", null],
  ])("renders an empty grid instead of crashing when content is %s", async (_label, content) => {
    stubAll()
    server.use(http.get(PRODUCTS, () => HttpResponse.json({ content, totalElements: 3, totalPages: 1 })))

    const data = await getListingPageData(params())

    expect(data.products).toEqual([])
  })
})

describe("getListingPageData — partial failure", () => {
  it.each([
    ["brands", BRANDS, "brands"],
    ["manufacturers", MANUFACTURERS, "manufacturers"],
    ["categories", CATEGORIES, "categories"],
    ["vendors", VENDORS, "vendors"],
    ["attributes", ATTRIBUTES, "attributeGroups"],
  ] as const)("renders the page with an empty %s facet when that call 500s", async (_label, url, key) => {
    stubAll()
    server.use(http.get(url, () => HttpResponse.json({ message: "boom" }, { status: 500 })))

    const data = await getListingPageData(params())

    expect(data[key]).toEqual([])
    // The grid itself is unaffected — this is the "partial render" half of the contract.
    expect(data.products).toEqual([{ id: "p-1" }])
  })

  it("survives every facet failing at once", async () => {
    stubAll()
    server.use(
      http.get(BRANDS, () => HttpResponse.error()),
      http.get(MANUFACTURERS, () => HttpResponse.error()),
      http.get(CATEGORIES, () => HttpResponse.error()),
      http.get(VENDORS, () => HttpResponse.error()),
      http.get(ATTRIBUTES, () => HttpResponse.error()),
    )

    const data = await getListingPageData(params())

    expect(data.products).toEqual([{ id: "p-1" }])
    expect([data.brands, data.manufacturers, data.categories, data.vendors, data.attributeGroups]).toEqual([
      [],
      [],
      [],
      [],
      [],
    ])
  })

  it.each([500, 404, 401])("rejects when the product query fails with %i", async (status) => {
    stubAll()
    server.use(http.get(PRODUCTS, () => HttpResponse.json({ message: "boom" }, { status })))

    await expect(getListingPageData(params())).rejects.toThrow()
  })

  it("rejects when the backend is unreachable for the product query", async () => {
    stubAll()
    server.use(http.get(PRODUCTS, () => HttpResponse.error()))

    await expect(getListingPageData(params())).rejects.toThrow()
  })
})
