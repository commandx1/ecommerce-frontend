import { describe, expect, it } from "vitest"
import { createProductsUrlBuilder } from "./buildProductsUrl"

type BuilderBase = Parameters<typeof createProductsUrlBuilder>[0]

const emptyBase: BuilderBase = {
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

const buildWith = (overrides: Partial<BuilderBase> = {}) => createProductsUrlBuilder({ ...emptyBase, ...overrides })

const queryOf = (url: string) => new URLSearchParams(url.slice(url.indexOf("?") + 1))

describe("createProductsUrlBuilder — baseline", () => {
  it("always emits page and size, even when they hold the defaults", () => {
    // NOTE: the builder has no notion of "default" for page/size — they are unconditional.
    expect(buildWith()()).toBe("/products?page=1&size=10")
  })

  it("never emits a bare '?' — page and size guarantee a non-empty query string", () => {
    const url = buildWith()()
    expect(url.startsWith("/products?")).toBe(true)
    expect(url.endsWith("?")).toBe(false)
  })

  it("omits every optional filter when nothing is selected", () => {
    const params = queryOf(buildWith()())
    expect([...params.keys()]).toEqual(["page", "size"])
  })
})

describe("createProductsUrlBuilder — pagination", () => {
  it("treats page as 1-indexed (the display page, matching PaginationBar)", () => {
    expect(buildWith({ currentPage: 3 })()).toBe("/products?page=3&size=10")
  })

  it("writes page=1 on the first page instead of omitting it", () => {
    expect(queryOf(buildWith({ currentPage: 1 })()).get("page")).toBe("1")
  })

  it("lets the override win over the base page", () => {
    expect(buildWith({ currentPage: 5 })({ page: 2 })).toBe("/products?page=2&size=10")
  })

  it("lets the override win over the base size", () => {
    expect(buildWith({ pageSize: 10 })({ size: 24 })).toBe("/products?page=1&size=24")
  })

  it("accepts both overrides at once", () => {
    expect(buildWith({ currentPage: 5, pageSize: 10 })({ page: 2, size: 60 })).toBe("/products?page=2&size=60")
  })

  it("keeps the base values when an empty override object is passed", () => {
    expect(buildWith({ currentPage: 4, pageSize: 24 })({})).toBe("/products?page=4&size=24")
  })

  // ASYMMETRY: the builder does not validate page/size. page=0 and negative pages are written
  // verbatim, but parseListingSearchParams coerces anything <= 0 back to page 1.
  it("writes a zero page verbatim without clamping it", () => {
    expect(queryOf(buildWith({ currentPage: 0 })()).get("page")).toBe("0")
  })

  it("writes a negative page verbatim without clamping it", () => {
    expect(queryOf(buildWith()({ page: -3 })).get("page")).toBe("-3")
  })

  // ASYMMETRY: parseListingSearchParams caps size at MAX_PAGE_SIZE (60); the builder does not.
  it("writes an over-sized page size verbatim without capping it", () => {
    expect(queryOf(buildWith({ pageSize: 500 })()).get("size")).toBe("500")
  })
})

describe("createProductsUrlBuilder — sort", () => {
  it.each(["price-asc", "price-desc", "rating", "newest", "name-asc"])("emits the valid sort value %s", (sort) => {
    expect(queryOf(buildWith({ sort })()).get("sort")).toBe(sort)
  })

  it("omits sort when it equals the 'best-match' default", () => {
    expect(queryOf(buildWith({ sort: "best-match" })()).has("sort")).toBe(false)
  })

  it("omits sort when it is an empty string", () => {
    expect(queryOf(buildWith({ sort: "" })()).has("sort")).toBe(false)
  })

  // ASYMMETRY: the builder passes unknown sort values through; the parser drops them to "best-match".
  it("passes an unknown sort value through untouched instead of falling back", () => {
    expect(queryOf(buildWith({ sort: "totally-unknown" })()).get("sort")).toBe("totally-unknown")
  })
})

describe("createProductsUrlBuilder — multi-value filters", () => {
  it("serializes arrays as repeated params, not as a comma-joined value", () => {
    const url = buildWith({ brands: ["nsk", "kavo"] })()
    expect(url).toBe("/products?page=1&size=10&brands=nsk&brands=kavo")
    expect(queryOf(url).getAll("brands")).toEqual(["nsk", "kavo"])
  })

  it.each(["brands", "manufacturers", "categories", "vendors", "attributes"] as const)(
    "repeats the %s param once per selected value",
    (key) => {
      const params = queryOf(buildWith({ [key]: ["a", "b", "c"] })())
      expect(params.getAll(key)).toEqual(["a", "b", "c"])
    },
  )

  it("omits an array param entirely when the array is empty", () => {
    expect(queryOf(buildWith({ brands: [] })()).has("brands")).toBe(false)
  })

  it("preserves the caller's array order", () => {
    expect(queryOf(buildWith({ vendors: ["z", "a", "m"] })()).getAll("vendors")).toEqual(["z", "a", "m"])
  })

  it("keeps duplicate values rather than de-duplicating them", () => {
    expect(queryOf(buildWith({ categories: ["x", "x"] })()).getAll("categories")).toEqual(["x", "x"])
  })

  // ASYMMETRY: the builder writes empty-string entries; parseStringArray filters them out.
  it("writes empty-string array entries instead of skipping them", () => {
    expect(queryOf(buildWith({ brands: ["", "kavo"] })()).getAll("brands")).toEqual(["", "kavo"])
  })

  it("emits every array family together in source order", () => {
    const url = buildWith({
      brands: ["b1"],
      manufacturers: ["m1"],
      categories: ["c1"],
      vendors: ["v1"],
      attributes: ["a1"],
    })()
    expect(url).toBe("/products?page=1&size=10&brands=b1&manufacturers=m1&categories=c1&vendors=v1&attributes=a1")
  })
})

describe("createProductsUrlBuilder — price and rating", () => {
  it("emits only minPrice when just the lower bound is set", () => {
    const params = queryOf(buildWith({ minPrice: 100 })())
    expect(params.get("minPrice")).toBe("100")
    expect(params.has("maxPrice")).toBe(false)
  })

  it("emits only maxPrice when just the upper bound is set", () => {
    const params = queryOf(buildWith({ maxPrice: 900 })())
    expect(params.get("maxPrice")).toBe("900")
    expect(params.has("minPrice")).toBe(false)
  })

  it("emits both bounds when the full range is set", () => {
    expect(buildWith({ minPrice: 10, maxPrice: 20 })()).toBe("/products?page=1&size=10&minPrice=10&maxPrice=20")
  })

  it("emits an inverted range (min > max) without correcting or dropping it", () => {
    expect(buildWith({ minPrice: 900, maxPrice: 10 })()).toBe("/products?page=1&size=10&minPrice=900&maxPrice=10")
  })

  it("keeps a zero lower bound (0 is not treated as absent)", () => {
    expect(queryOf(buildWith({ minPrice: 0 })()).get("minPrice")).toBe("0")
  })

  it("keeps a zero upper bound", () => {
    expect(queryOf(buildWith({ maxPrice: 0 })()).get("maxPrice")).toBe("0")
  })

  it("preserves decimal prices", () => {
    expect(queryOf(buildWith({ minPrice: 19.99 })()).get("minPrice")).toBe("19.99")
  })

  // ASYMMETRY: negative bounds are written out, but parsePositiveFloat rejects them and returns null.
  it("writes a negative price bound verbatim", () => {
    expect(queryOf(buildWith({ minPrice: -5 })()).get("minPrice")).toBe("-5")
  })

  it("omits price params when both bounds are null", () => {
    const params = queryOf(buildWith({ minPrice: null, maxPrice: null })())
    expect(params.has("minPrice")).toBe(false)
    expect(params.has("maxPrice")).toBe(false)
  })

  it("emits minRating when set and omits it when null", () => {
    expect(queryOf(buildWith({ minRating: 4 })()).get("minRating")).toBe("4")
    expect(queryOf(buildWith({ minRating: null })()).has("minRating")).toBe(false)
  })

  it("keeps a zero minRating", () => {
    expect(queryOf(buildWith({ minRating: 0 })()).get("minRating")).toBe("0")
  })
})

describe("createProductsUrlBuilder — inStock", () => {
  it("omits inStock when it is true (true is the URL default)", () => {
    expect(queryOf(buildWith({ inStock: true })()).has("inStock")).toBe(false)
  })

  it("writes inStock=false when the filter is switched off", () => {
    expect(buildWith({ inStock: false })()).toBe("/products?page=1&size=10&inStock=false")
  })
})

describe("createProductsUrlBuilder — encoding", () => {
  it("encodes a space as '+'", () => {
    expect(buildWith({ brands: ["dental care"] })()).toContain("brands=dental+care")
  })

  it.each([
    ["ampersand", "a&b", "a%26b"],
    ["equals", "a=b", "a%3Db"],
    ["plus", "a+b", "a%2Bb"],
    ["hash", "a#b", "a%23b"],
    ["question mark", "a?b", "a%3Fb"],
    ["percent", "a%b", "a%25b"],
  ])("percent-encodes the %s in a filter value", (_label, raw, encoded) => {
    expect(buildWith({ brands: [raw] })()).toContain(`brands=${encoded}`)
  })

  it("percent-encodes Turkish characters as UTF-8", () => {
    expect(buildWith({ brands: ["çğışöü"] })()).toContain("brands=%C3%A7%C4%9F%C4%B1%C5%9F%C3%B6%C3%BC")
  })

  it.each([
    ["ampersand + equals", "a&b=c"],
    ["turkish", "İmplant Çelik"],
    ["emoji", "🦷 implant"],
    ["slash and colon", "a/b:c"],
    ["quotes", `he said "hi"`],
  ])("survives a decode round-trip for %s", (_label, raw) => {
    expect(queryOf(buildWith({ brands: [raw] })()).getAll("brands")).toEqual([raw])
  })

  it("does not let an injected value forge extra params", () => {
    const params = queryOf(buildWith({ brands: ["evil&inStock=false"] })())
    expect(params.getAll("brands")).toEqual(["evil&inStock=false"])
    expect(params.has("inStock")).toBe(false)
  })
})

describe("createProductsUrlBuilder — companyId (TEST-FINDINGS K7 regression)", () => {
  it("omits companyId when it is null", () => {
    expect(queryOf(buildWith({ companyId: null })()).has("companyId")).toBe(false)
  })

  it("omits companyId when it is an empty string", () => {
    expect(queryOf(buildWith({ companyId: "" })()).has("companyId")).toBe(false)
  })

  it("does not change the URL at all when companyId is absent", () => {
    expect(buildWith({ companyId: null })()).toBe("/products?page=1&size=10")
  })

  it("keeps companyId when changing the page", () => {
    const url = buildWith({ companyId: "company-9" })({ page: 2 })
    expect(queryOf(url).get("companyId")).toBe("company-9")
    expect(queryOf(url).get("page")).toBe("2")
  })

  it("keeps companyId when changing the page size", () => {
    const url = buildWith({ companyId: "company-9" })({ size: 50 })
    expect(queryOf(url).get("companyId")).toBe("company-9")
    expect(queryOf(url).get("size")).toBe("50")
  })

  it("keeps companyId alongside other filters", () => {
    expect(buildWith({ companyId: "company-9", brands: ["nsk"], inStock: false })()).toBe(
      "/products?page=1&size=10&brands=nsk&inStock=false&companyId=company-9",
    )
  })
})

describe("createProductsUrlBuilder — builder reuse", () => {
  it("returns a reusable builder that does not accumulate params across calls", () => {
    const build = buildWith({ brands: ["nsk"] })
    const first = build({ page: 2 })
    const second = build({ page: 3 })
    expect(first).toBe("/products?page=2&size=10&brands=nsk")
    expect(second).toBe("/products?page=3&size=10&brands=nsk")
  })

  it("keeps every filter when only the page is overridden", () => {
    const build = buildWith({
      currentPage: 1,
      pageSize: 24,
      sort: "price-asc",
      brands: ["nsk"],
      minPrice: 10,
      maxPrice: 100,
      minRating: 4,
      inStock: false,
      attributes: ["color:red"],
    })
    expect(build({ page: 7 })).toBe(
      "/products?page=7&size=24&sort=price-asc&brands=nsk&minPrice=10&maxPrice=100&minRating=4&inStock=false&attributes=color%3Ared",
    )
  })
})
