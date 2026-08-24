// Round-trip contract between the two halves of the product-listing URL layer:
//
//   filters --createProductsUrlBuilder--> /products?... --Next router--> parseListingSearchParams --> filters
//
// The file deliberately lives above both modules (neither owns the contract), so a failure here
// points at "the two ends disagree" rather than at either module's own unit suite.
import { describe, expect, it } from "vitest"
import { createProductsUrlBuilder } from "./components/listing/buildProductsUrl"
import { type ListingSearchParams, parseListingSearchParams } from "./server/parse-listing-search-params"

type BuilderBase = Parameters<typeof createProductsUrlBuilder>[0]

const ARRAY_KEYS = ["brands", "manufacturers", "categories", "vendors", "attributes"] as const
const SCALAR_KEYS = ["page", "size", "sort", "minPrice", "maxPrice", "minRating", "inStock", "companyId"] as const

/**
 * Stands in for the Next.js router + server boundary: takes the URL the builder produced and
 * hands back the `searchParams` object a Server Component would receive.
 */
const routeThroughNext = (url: string): ListingSearchParams => {
  const search = new URLSearchParams(url.slice(url.indexOf("?") + 1))
  const params: ListingSearchParams = {}
  for (const key of SCALAR_KEYS) {
    const value = search.get(key)
    if (value !== null) params[key] = value
  }
  for (const key of ARRAY_KEYS) {
    const values = search.getAll(key)
    if (values.length > 0) params[key] = values
  }
  return params
}

const roundTrip = (filters: BuilderBase) =>
  parseListingSearchParams(routeThroughNext(createProductsUrlBuilder(filters)()))

const baseFilters: BuilderBase = {
  currentPage: 1,
  pageSize: 10,
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
}

const filtersOf = (overrides: Partial<BuilderBase> = {}): BuilderBase => ({ ...baseFilters, ...overrides })

const symmetricCases: [name: string, filters: BuilderBase][] = [
  ["no filters at all", filtersOf()],
  ["a single brand", filtersOf({ brands: ["nsk"] })],
  ["several brands", filtersOf({ brands: ["nsk", "kavo", "dentsply"] })],
  [
    "one value in every array family",
    filtersOf({ brands: ["b"], manufacturers: ["m"], categories: ["c"], vendors: ["v"], attributes: ["a"] }),
  ],
  ["a full price range", filtersOf({ minPrice: 10, maxPrice: 250 })],
  ["only a lower price bound", filtersOf({ minPrice: 99.95 })],
  ["only an upper price bound", filtersOf({ maxPrice: 5000 })],
  ["a zero lower bound", filtersOf({ minPrice: 0 })],
  ["a rating filter", filtersOf({ minRating: 4 })],
  ["stock filter switched off", filtersOf({ inStock: false })],
  ["a non-default sort", filtersOf({ sort: "price-desc" })],
  ["a deep page with a custom page size", filtersOf({ currentPage: 7, pageSize: 24 })],
  ["the maximum allowed page size", filtersOf({ pageSize: 60 })],
  ["an inverted price range (preserved as-is on both ends)", filtersOf({ minPrice: 900, maxPrice: 10 })],
  ["values needing URL encoding", filtersOf({ brands: ["a&b=c", "İmplant Çelik", "🦷 implant", "50% off"] })],
  ["attribute pairs with reserved characters", filtersOf({ attributes: ["color:red", "size=XL", "a+b"] })],
  ["a companyId scope", filtersOf({ companyId: "company-9" })],
  [
    "everything set at once",
    filtersOf({
      currentPage: 3,
      pageSize: 24,
      sort: "name-asc",
      brands: ["nsk", "kavo"],
      manufacturers: ["m1"],
      categories: ["hand-tools", "İmplant"],
      vendors: ["v1", "v2"],
      minPrice: 10.5,
      maxPrice: 999,
      minRating: 3,
      inStock: false,
      attributes: ["color:red"],
      companyId: "company-9",
    }),
  ],
]

describe("products URL round-trip: parse(build(filters)) === filters", () => {
  it.each(symmetricCases)("%s", (_name, filters) => {
    expect(roundTrip(filters)).toEqual({
      displayPage: filters.currentPage,
      pageSize: filters.pageSize,
      apiPage: filters.currentPage - 1,
      sort: filters.sort,
      brands: filters.brands,
      manufacturers: filters.manufacturers,
      categories: filters.categories,
      vendors: filters.vendors,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minRating: filters.minRating,
      inStock: filters.inStock,
      attributes: filters.attributes,
      companyId: filters.companyId,
    })
  })

  it.each(symmetricCases)("%s is idempotent across a second round-trip", (_name, filters) => {
    const once = roundTrip(filters)
    const twice = roundTrip(
      filtersOf({
        currentPage: once.displayPage,
        pageSize: once.pageSize,
        sort: once.sort,
        brands: once.brands,
        manufacturers: once.manufacturers,
        categories: once.categories,
        vendors: once.vendors,
        minPrice: once.minPrice,
        maxPrice: once.maxPrice,
        minRating: once.minRating,
        inStock: once.inStock,
        attributes: once.attributes,
        companyId: once.companyId,
      }),
    )
    expect(twice).toEqual(once)
  })
})

describe("products URL round-trip: known asymmetries (locked in, NOT endorsed)", () => {
  // FIX (TEST-FINDINGS K7): companyId now survives every rebuilt link — the builder writes it
  // back out whenever it is set, so a company-scoped visitor keeps that scope through pagination,
  // sorting, and filter changes instead of silently falling back to the full catalog.
  it("keeps companyId across every navigation", () => {
    const url = createProductsUrlBuilder(filtersOf({ companyId: "company-9" }))()
    expect(url).toContain("companyId=company-9")
    expect(parseListingSearchParams(routeThroughNext(url)).companyId).toBe("company-9")
  })

  // ASYMMETRY 2 — unknown sort values survive the build but not the parse.
  // build: writes sort=totally-unknown verbatim.
  // parse: falls back to "best-match".
  // Effect: harmless today (the UI only offers valid values) but any future sort value added to
  // the client without updating VALID_SORT_VALUES will silently do nothing.
  it("loses an unknown sort value", () => {
    expect(roundTrip(filtersOf({ sort: "totally-unknown" })).sort).toBe("best-match")
  })

  // ASYMMETRY 3 — page 0 / negative pages.
  // build: writes page=0 verbatim (no clamping).
  // parse: parsePositiveInt rejects <= 0 and returns page 1.
  // Effect: the builder is fed a 1-indexed display page by PaginationBar, so this is unreachable
  // from the UI today; a caller that mistakenly passes a 0-indexed page would land on page 1.
  it.each([0, -3])("clamps page %i back to 1", (page) => {
    const parsed = roundTrip(filtersOf({ currentPage: page }))
    expect(parsed.displayPage).toBe(1)
    expect(parsed.apiPage).toBe(0)
  })

  // ASYMMETRY 4 — page size above MAX_PAGE_SIZE (60).
  // build: writes size=500.
  // parse: caps it at 60.
  // Effect: a "show 100 per page" control would appear to work in the URL but silently serve 60.
  it("caps an over-sized page size at 60", () => {
    expect(roundTrip(filtersOf({ pageSize: 500 })).pageSize).toBe(60)
  })

  // ASYMMETRY 5 — negative numeric bounds.
  // build: writes minPrice=-5 / minRating=-1 verbatim.
  // parse: parsePositiveFloat rejects negatives and returns null.
  // Effect: a negative bound silently disappears instead of being rejected at the source.
  it("drops a negative minPrice", () => {
    expect(roundTrip(filtersOf({ minPrice: -5 })).minPrice).toBeNull()
  })

  it("drops a negative minRating", () => {
    expect(roundTrip(filtersOf({ minRating: -1 })).minRating).toBeNull()
  })

  // ASYMMETRY 6 — empty-string entries in array filters.
  // build: appends brands= (empty value).
  // parse: parseStringArray filters falsy entries out.
  // Effect: array lengths differ across the round-trip; a checkbox whose value is "" would appear
  // checked in the URL yet be invisible to the server.
  it("drops empty-string array entries", () => {
    expect(roundTrip(filtersOf({ brands: ["", "kavo"] })).brands).toEqual(["kavo"])
  })

  // ASYMMETRY 7 — the URL is never "clean".
  // build: always writes page and size, even at their defaults (page=1&size=10).
  // parse: would have produced exactly those values from an empty query string.
  // Effect: cosmetic — /products and /products?page=1&size=10 are the same page but two URLs,
  // which splits analytics and canonical-URL/SEO signals.
  it("always writes page and size even when they match the parser defaults", () => {
    expect(createProductsUrlBuilder(filtersOf())()).toBe("/products?page=1&size=10")
    expect(parseListingSearchParams({})).toMatchObject({ displayPage: 1, pageSize: 10 })
  })
})

describe("products URL round-trip: no search-term support on either end", () => {
  // Neither module knows about a free-text search param (q / search / keyword). Locking this in so
  // that whoever adds search has to add it to BOTH ends and update this test.
  it("the builder emits no free-text search param", () => {
    const url = createProductsUrlBuilder(filtersOf({ brands: ["nsk"] }))()
    for (const key of ["q", "search", "keyword", "term"]) {
      expect(new URLSearchParams(url.slice(url.indexOf("?") + 1)).has(key)).toBe(false)
    }
  })

  it("the parser ignores a free-text search param placed in the URL by hand", () => {
    const parsed = parseListingSearchParams({ ...({ q: "implant" } as unknown as ListingSearchParams) })
    expect(parsed).not.toHaveProperty("q")
  })
})
