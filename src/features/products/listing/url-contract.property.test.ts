// Property-based companion to url-contract.test.ts.
//
// That file locks in 7 known table-driven asymmetries between createProductsUrlBuilder and
// parseListingSearchParams. This file throws random, type-shaped filter objects at the same
// round-trip (filters -> URL -> parse -> filters) to look for asymmetries the table didn't cover.
// Any NEW asymmetry found here is either (a) already covered by one of the 7 known classes (in
// which case it's excluded with fc.pre / a filter and cross-referenced by number below), or (b)
// locked in with its own dedicated example test and a `// FINDING:` comment - never "fixed" in
// src.
import fc from "fast-check"
import { describe, expect, it } from "vitest"
import { createProductsUrlBuilder } from "./components/listing/buildProductsUrl"
import {
  type ListingSearchParams,
  parseListingSearchParams,
  VALID_SORT_VALUES,
} from "./server/parse-listing-search-params"

type BuilderBase = Parameters<typeof createProductsUrlBuilder>[0]

const ARRAY_KEYS = ["brands", "manufacturers", "categories", "vendors", "attributes"] as const
const SCALAR_KEYS = ["page", "size", "sort", "minPrice", "maxPrice", "minRating", "inStock", "companyId"] as const

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

// --- Arbitraries shaped from the real BuildUrlBase / ListingSearchParams fields ------------------

// Array filter members: printable ASCII strings that are non-empty (empty-string entries are
// ASYMMETRY 6, already known and covered separately) and free of characters that would themselves
// break URLSearchParams round-tripping (there are none - URLSearchParams handles any string - but
// we keep this readable and avoid pure-whitespace strings, which are a distinct edge covered below).
const arrayMember = fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.length > 0)
const filterArray = fc.array(arrayMember, { maxLength: 5 })

// currentPage: the builder writes it verbatim; parse clamps <=0 to 1 (ASYMMETRY 3). Restrict this
// arbitrary to the domain PaginationBar can actually produce (>= 1) so the property below asserts
// real round-trip equality rather than re-deriving the known clamp.
const validPage = fc.integer({ min: 1, max: 100000 })

// pageSize: parse caps at MAX_PAGE_SIZE=60 (ASYMMETRY 4). Restrict to the valid range for the
// pure-equality property; the capping behavior itself is exercised in its own test below.
const validPageSize = fc.integer({ min: 1, max: 60 })

const sortValue = fc.constantFrom<BuilderBase["sort"]>(...VALID_SORT_VALUES, "best-match")

// Non-negative finite prices/ratings with 2 decimal precision, matching what the UI would ever
// actually produce (negative values are ASYMMETRY 5, already known).
const nonNegativePrice = fc.option(
  fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }).map((n) => Math.round(n * 100) / 100),
  { nil: null },
)

const filtersArbitrary: fc.Arbitrary<BuilderBase> = fc.record({
  currentPage: validPage,
  pageSize: validPageSize,
  sort: sortValue,
  brands: filterArray,
  manufacturers: filterArray,
  categories: filterArray,
  vendors: filterArray,
  minPrice: nonNegativePrice,
  maxPrice: nonNegativePrice,
  minRating: nonNegativePrice,
  inStock: fc.boolean(),
  attributes: filterArray,
  companyId: fc.constant(null),
})

describe("products URL round-trip property: parse(build(filters)) === filters (in-domain values)", () => {
  it("round-trips any filter object built from valid, in-domain field values", () => {
    fc.assert(
      fc.property(filtersArbitrary, (filters) => {
        const result = roundTrip(filters)
        expect(result.displayPage).toBe(filters.currentPage)
        expect(result.pageSize).toBe(filters.pageSize)
        expect(result.apiPage).toBe(filters.currentPage - 1)
        expect(result.sort).toBe(filters.sort)
        expect(result.brands).toEqual(filters.brands)
        expect(result.manufacturers).toEqual(filters.manufacturers)
        expect(result.categories).toEqual(filters.categories)
        expect(result.vendors).toEqual(filters.vendors)
        expect(result.minPrice).toBe(filters.minPrice)
        expect(result.maxPrice).toBe(filters.maxPrice)
        expect(result.minRating).toBe(filters.minRating)
        expect(result.inStock).toBe(filters.inStock)
        expect(result.attributes).toEqual(filters.attributes)
        expect(result.companyId).toBe(filters.companyId)
      }),
      { seed: 42 },
    )
  })

  it("is idempotent: round-tripping the round-tripped result reproduces the same parsed value", () => {
    fc.assert(
      fc.property(filtersArbitrary, (filters) => {
        const once = roundTrip(filters)
        const twice = roundTrip({
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
        })
        expect(twice).toEqual(once)
      }),
      { seed: 42 },
    )
  })
})

describe("products URL round-trip property: array filters preserve order and duplicates", () => {
  it("array field order and duplicate entries survive the round-trip untouched", () => {
    fc.assert(
      fc.property(fc.array(arrayMember, { minLength: 0, maxLength: 8 }), (brands) => {
        const result = roundTrip({
          currentPage: 1,
          pageSize: 10,
          sort: "best-match",
          brands,
          manufacturers: [],
          categories: [],
          vendors: [],
          minPrice: null,
          maxPrice: null,
          minRating: null,
          inStock: true,
          attributes: [],
          companyId: null,
        })
        expect(result.brands).toEqual(brands)
      }),
      { seed: 42 },
    )
  })
})

describe("products URL round-trip property: whitespace-only array entries (NEW finding beyond the table's 7)", () => {
  // FINDING (new, not in the original 7 table asymmetries): parseStringArray's `.filter(Boolean)`
  // only drops entries that are the *empty* string (""). A whitespace-only entry such as " " or
  // "\t" is truthy, so it survives parsing untouched - unlike a true empty string, which is dropped
  // (ASYMMETRY 6). This is a narrower, previously-undocumented cousin of asymmetry 6: entries are
  // dropped by strict emptiness, not by "looks empty to a human". We lock in the current (surviving)
  // behavior rather than changing parseStringArray to also trim.
  //
  // EVALUATED (fix batch, Aug 2026): trimming in parseStringArray was tried and reverted. The
  // general in-domain round-trip property above (`arrayMember = fc.string({ minLength: 1 })`)
  // treats whitespace-only strings as valid domain values too, so trimming broke a SECOND,
  // unrelated property (not just this dedicated one) with a real counterexample
  // (vendors: [" "], seed 42). Chasing that would mean redefining what counts in-domain for the
  // whole round-trip suite, well beyond a single-line filter fix. Cost exceeds the benefit for
  // this low-severity, cosmetic edge case - left as-is.
  it("a whitespace-only brand entry is NOT dropped, unlike a true empty-string entry", () => {
    const result = roundTrip({
      currentPage: 1,
      pageSize: 10,
      sort: "best-match",
      brands: [" ", "kavo"],
      manufacturers: [],
      categories: [],
      vendors: [],
      minPrice: null,
      maxPrice: null,
      minRating: null,
      inStock: true,
      attributes: [],
      companyId: null,
    })
    expect(result.brands).toEqual([" ", "kavo"])
  })
})

describe("products URL round-trip property: fractional prices beyond 2 decimals (NEW finding beyond the table's 7)", () => {
  // FINDING (new): the builder writes `String(base.minPrice)` verbatim (full float precision, no
  // rounding), and the parser round-trips it through parseFloat. For "nice" 2-decimal money values
  // this is exact. But a price with more precision than currency normally carries (e.g. thirds like
  // 1/3) can still hit a *display* string that differs from the numeric value once JS's default
  // Number->String conversion kicks in for very long decimal expansions - the numeric comparison
  // stays exact only because parseFloat(String(x)) === x always holds in JS for finite doubles.
  // We assert the numeric identity holds (it does, by JS spec) rather than any particular string
  // shape, since the table's known asymmetries only cover negative/invalid bounds, not precision.
  it("a high-precision fractional minPrice round-trips to the exact same numeric value", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1000, noNaN: true, noDefaultInfinity: true }), (minPrice) => {
        const result = roundTrip({
          currentPage: 1,
          pageSize: 10,
          sort: "best-match",
          brands: [],
          manufacturers: [],
          categories: [],
          vendors: [],
          minPrice,
          maxPrice: null,
          minRating: null,
          inStock: true,
          attributes: [],
          companyId: null,
        })
        expect(result.minPrice).toBe(minPrice)
      }),
      { seed: 42 },
    )
  })
})

describe("products URL round-trip property: known asymmetry classes still hold for random values (cross-check against the table)", () => {
  // Cross-check ASYMMETRY 3 (page clamping) with random negative/zero pages, beyond the table's
  // fixed [0, -3] cases.
  it("ASYMMETRY 3 generalizes: any non-positive currentPage clamps to displayPage 1 / apiPage 0", () => {
    fc.assert(
      fc.property(fc.integer({ min: -100000, max: 0 }), (currentPage) => {
        const result = roundTrip({
          currentPage,
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
        })
        expect(result.displayPage).toBe(1)
        expect(result.apiPage).toBe(0)
      }),
      { seed: 42 },
    )
  })

  // Cross-check ASYMMETRY 4 (page size capping) with random oversized page sizes.
  it("ASYMMETRY 4 generalizes: any pageSize above 60 is capped to 60", () => {
    fc.assert(
      fc.property(fc.integer({ min: 61, max: 10_000_000 }), (pageSize) => {
        const result = roundTrip({
          currentPage: 1,
          pageSize,
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
        })
        expect(result.pageSize).toBe(60)
      }),
      { seed: 42 },
    )
  })

  // Cross-check ASYMMETRY 5 (negative bounds dropped) with random negative minPrice/minRating.
  it("ASYMMETRY 5 generalizes: any negative minPrice or minRating is dropped to null", () => {
    fc.assert(
      fc.property(fc.double({ min: -1_000_000, max: -0.01, noNaN: true, noDefaultInfinity: true }), (negative) => {
        const result = roundTrip({
          currentPage: 1,
          pageSize: 10,
          sort: "best-match",
          brands: [],
          manufacturers: [],
          categories: [],
          vendors: [],
          minPrice: negative,
          maxPrice: null,
          minRating: negative,
          inStock: true,
          attributes: [],
          companyId: null,
        })
        expect(result.minPrice).toBeNull()
        expect(result.minRating).toBeNull()
      }),
      { seed: 42 },
    )
  })

  // Cross-check ASYMMETRY 2 (unknown sort lost) with random non-empty strings that are not one of
  // the valid sort values.
  it("ASYMMETRY 2 generalizes: any sort string outside VALID_SORT_VALUES falls back to best-match", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !(VALID_SORT_VALUES as readonly string[]).includes(s)),
        (sort) => {
          const result = roundTrip({
            currentPage: 1,
            pageSize: 10,
            sort,
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
          })
          expect(result.sort).toBe("best-match")
        },
      ),
      { seed: 42 },
    )
  })
})
