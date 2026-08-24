import { describe, expect, it } from "vitest"
import {
  type ListingSearchParams,
  type ParsedListingSearchParams,
  parseListingSearchParams,
  VALID_SORT_VALUES,
} from "./parse-listing-search-params"

const DEFAULTS: ParsedListingSearchParams = {
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
}

const parse = (params: ListingSearchParams = {}) => parseListingSearchParams(params)

describe("parseListingSearchParams — defaults", () => {
  it("returns the full default shape for an empty searchParams object", () => {
    expect(parse()).toEqual(DEFAULTS)
  })

  it("returns the defaults when every key is explicitly undefined", () => {
    expect(
      parse({
        page: undefined,
        size: undefined,
        sort: undefined,
        brands: undefined,
        manufacturers: undefined,
        categories: undefined,
        vendors: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        minRating: undefined,
        inStock: undefined,
        attributes: undefined,
        companyId: undefined,
      }),
    ).toEqual(DEFAULTS)
  })

  it("ignores unknown keys instead of throwing", () => {
    const withJunk = { someUnknownKey: "boom", another: ["a"] } as unknown as ListingSearchParams
    expect(() => parse(withJunk)).not.toThrow()
    expect(parse(withJunk)).toEqual(DEFAULTS)
  })
})

describe("parseListingSearchParams — paging", () => {
  it("parses a valid display page and derives the zero-based apiPage", () => {
    const result = parse({ page: "3" })
    expect(result.displayPage).toBe(3)
    expect(result.apiPage).toBe(2)
  })

  it("maps page=1 to apiPage 0", () => {
    expect(parse({ page: "1" })).toMatchObject({ displayPage: 1, apiPage: 0 })
  })

  it.each([
    ["non-numeric", "abc"],
    ["empty string", ""],
    ["zero", "0"],
    ["negative", "-1"],
    ["NaN literal", "NaN"],
    ["Infinity literal", "Infinity"],
    ["whitespace", "   "],
    ["null literal", "null"],
  ])("falls back to page 1 for a %s page value", (_label, page) => {
    expect(parse({ page })).toMatchObject({ displayPage: 1, apiPage: 0 })
  })

  it("accepts a very large page without clamping it", () => {
    expect(parse({ page: "999999" })).toMatchObject({ displayPage: 999999, apiPage: 999998 })
  })

  it("truncates a fractional page via parseInt", () => {
    expect(parse({ page: "2.9" }).displayPage).toBe(2)
  })

  it("parses a leading-numeric string via parseInt semantics", () => {
    expect(parse({ page: "12abc" }).displayPage).toBe(12)
  })

  it("keeps a valid page size", () => {
    expect(parse({ size: "24" }).pageSize).toBe(24)
  })

  it("caps the page size at 60", () => {
    expect(parse({ size: "500" }).pageSize).toBe(60)
  })

  it.each([
    ["non-numeric", "xyz"],
    ["zero", "0"],
    ["negative", "-10"],
  ])("falls back to page size 10 for a %s size value", (_label, size) => {
    expect(parse({ size }).pageSize).toBe(10)
  })

  it("never returns a negative apiPage", () => {
    expect(parse({ page: "-99" }).apiPage).toBe(0)
  })
})

describe("parseListingSearchParams — sort", () => {
  it.each(VALID_SORT_VALUES)("keeps the valid sort value %s", (sort) => {
    expect(parse({ sort }).sort).toBe(sort)
  })

  it.each([
    ["unknown", "cheapest-first"],
    ["empty", ""],
    ["case-mismatched", "PRICE-ASC"],
    ["injected", "price-asc; DROP TABLE"],
    ["the default itself", "best-match"],
  ])("falls back to best-match for a %s sort value", (_label, sort) => {
    expect(parse({ sort }).sort).toBe("best-match")
  })
})

describe("parseListingSearchParams — array filters", () => {
  const arrayKeys = ["brands", "manufacturers", "categories", "vendors", "attributes"] as const

  it.each(arrayKeys)("wraps a single %s string into a one-element array", (key) => {
    expect(parse({ [key]: "nsk" })[key]).toEqual(["nsk"])
  })

  it.each(arrayKeys)("keeps a repeated %s param as an array", (key) => {
    expect(parse({ [key]: ["nsk", "kavo"] })[key]).toEqual(["nsk", "kavo"])
  })

  it.each(arrayKeys)("returns an empty array for a missing %s param", (key) => {
    expect(parse({})[key]).toEqual([])
  })

  it("drops empty strings from an array value", () => {
    expect(parse({ brands: ["", "kavo", ""] }).brands).toEqual(["kavo"])
  })

  it("treats a lone empty string as no filter at all", () => {
    expect(parse({ brands: "" }).brands).toEqual([])
  })

  it("returns an empty array for an empty array value", () => {
    expect(parse({ brands: [] }).brands).toEqual([])
  })

  it("keeps duplicates rather than de-duplicating", () => {
    expect(parse({ vendors: ["v1", "v1"] }).vendors).toEqual(["v1", "v1"])
  })

  it("preserves an extremely long value without throwing or truncating", () => {
    const huge = "x".repeat(10_000)
    expect(() => parse({ brands: huge })).not.toThrow()
    expect(parse({ brands: huge }).brands).toEqual([huge])
  })

  it("keeps values with special and non-ASCII characters intact", () => {
    const values = ["a&b=c", "İmplant Çelik", "🦷", "<script>"]
    expect(parse({ categories: values }).categories).toEqual(values)
  })

  it("keeps the array families independent of one another", () => {
    const result = parse({ brands: "b", manufacturers: "m", categories: "c", vendors: "v", attributes: "a" })
    expect(result).toMatchObject({
      brands: ["b"],
      manufacturers: ["m"],
      categories: ["c"],
      vendors: ["v"],
      attributes: ["a"],
    })
  })
})

describe("parseListingSearchParams — numeric filters", () => {
  const numericKeys = ["minPrice", "maxPrice", "minRating"] as const

  it.each(numericKeys)("parses a valid %s", (key) => {
    expect(parse({ [key]: "42" })[key]).toBe(42)
  })

  it.each(numericKeys)("parses a decimal %s", (key) => {
    expect(parse({ [key]: "19.99" })[key]).toBe(19.99)
  })

  it.each(numericKeys)("keeps 0 as a real value for %s (not null)", (key) => {
    expect(parse({ [key]: "0" })[key]).toBe(0)
  })

  it.each(numericKeys)("returns null for a missing %s", (key) => {
    expect(parse({})[key]).toBeNull()
  })

  it.each([
    ["non-numeric", "xyz"],
    ["negative", "-5"],
    ["empty string", ""],
    ["NaN literal", "NaN"],
    ["negative decimal", "-0.5"],
  ])("returns null for a %s minPrice", (_label, minPrice) => {
    expect(parse({ minPrice }).minPrice).toBeNull()
  })

  it("returns null for an Infinity price (not finite)", () => {
    expect(parse({ minPrice: "Infinity" }).minPrice).toBeNull()
  })

  it("parses a leading-numeric string via parseFloat semantics", () => {
    expect(parse({ minPrice: "12abc" }).minPrice).toBe(12)
  })

  it("accepts exponent notation", () => {
    expect(parse({ maxPrice: "1e3" }).maxPrice).toBe(1000)
  })

  it("does not reorder or reject an inverted price range", () => {
    expect(parse({ minPrice: "900", maxPrice: "10" })).toMatchObject({ minPrice: 900, maxPrice: 10 })
  })

  it("does not cap minRating at 5", () => {
    expect(parse({ minRating: "99" }).minRating).toBe(99)
  })
})

describe("parseListingSearchParams — inStock", () => {
  it("defaults to true when the param is absent", () => {
    expect(parse({}).inStock).toBe(true)
  })

  it("is false only for the exact string 'false'", () => {
    expect(parse({ inStock: "false" }).inStock).toBe(false)
  })

  it.each([
    ["true", "true"],
    ["1", "1"],
    ["0", "0"],
    ["empty", ""],
    ["capitalised False", "False"],
    ["garbage", "nope"],
  ])("stays true for the %s value", (_label, inStock) => {
    expect(parse({ inStock }).inStock).toBe(true)
  })
})

describe("parseListingSearchParams — companyId", () => {
  it("passes a companyId through untouched", () => {
    expect(parse({ companyId: "acme-42" }).companyId).toBe("acme-42")
  })

  it("returns null when companyId is absent", () => {
    expect(parse({}).companyId).toBeNull()
  })

  it("keeps an empty companyId string as an empty string rather than null", () => {
    expect(parse({ companyId: "" }).companyId).toBe("")
  })
})

describe("parseListingSearchParams — hostile input never throws", () => {
  const hostile: ListingSearchParams[] = [
    { page: "abc" },
    { page: "-1" },
    { page: "999999" },
    { page: "1e309" },
    { size: "0" },
    { minPrice: "xyz" },
    { minPrice: "-5" },
    { maxPrice: "-1e999" },
    { minRating: "not-a-number" },
    { sort: "unknown-sort" },
    { inStock: "maybe" },
    { brands: [] },
    { brands: ["", ""] },
    { brands: "x".repeat(50_000) },
    { companyId: "<script>alert(1)</script>" },
    { page: "abc", size: "abc", minPrice: "abc", maxPrice: "abc", minRating: "abc", sort: "abc", inStock: "abc" },
  ]

  it.each(hostile.map((params, index) => [index, params] as const))(
    "case %i parses without throwing and returns a well-formed object",
    (_index, params) => {
      expect(() => parseListingSearchParams(params)).not.toThrow()
      const result = parseListingSearchParams(params)
      expect(result.displayPage).toBeGreaterThan(0)
      expect(result.apiPage).toBeGreaterThanOrEqual(0)
      expect(result.pageSize).toBeGreaterThan(0)
      expect(result.pageSize).toBeLessThanOrEqual(60)
      const knownSort = VALID_SORT_VALUES.includes(result.sort as (typeof VALID_SORT_VALUES)[number])
      expect(knownSort || result.sort === "best-match").toBe(true)
      expect(Array.isArray(result.brands)).toBe(true)
      expect(typeof result.inStock).toBe("boolean")
    },
  )
})

describe("parseListingSearchParams — Next.js searchParams variants", () => {
  it("accepts the string variant for every array-capable key", () => {
    const result = parse({ brands: "b", categories: "c", vendors: "v", manufacturers: "m", attributes: "a" })
    expect(result.brands).toEqual(["b"])
    expect(result.attributes).toEqual(["a"])
  })

  it("accepts the string[] variant produced by repeated query params", () => {
    const result = parse({ brands: ["b1", "b2", "b3"] })
    expect(result.brands).toEqual(["b1", "b2", "b3"])
  })

  it("matches what a real URLSearchParams round-trip would hand Next.js", () => {
    const search = new URLSearchParams("page=2&size=24&brands=nsk&brands=kavo&minPrice=10&inStock=false")
    const asNextParams: ListingSearchParams = {
      page: search.get("page") ?? undefined,
      size: search.get("size") ?? undefined,
      brands: search.getAll("brands"),
      minPrice: search.get("minPrice") ?? undefined,
      inStock: search.get("inStock") ?? undefined,
    }
    expect(parse(asNextParams)).toMatchObject({
      displayPage: 2,
      apiPage: 1,
      pageSize: 24,
      brands: ["nsk", "kavo"],
      minPrice: 10,
      inStock: false,
    })
  })

  it("uses the last value when a duplicated scalar param is collapsed by the framework", () => {
    // Next.js collapses duplicate scalar keys itself; the parser only ever sees one string.
    const search = new URLSearchParams("page=2&page=5")
    expect(parse({ page: search.getAll("page").at(-1) }).displayPage).toBe(5)
  })
})
