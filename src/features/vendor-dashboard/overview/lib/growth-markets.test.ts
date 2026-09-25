import { describe, expect, it } from "vitest"
import type { VendorGeographicCity } from "@/lib/api/vendor-dashboard"
import { buildGrowthMarkets } from "./growth-markets"

const city = (overrides: Partial<VendorGeographicCity> = {}): VendorGeographicCity => ({
  city: "New York",
  buyerCount: 10,
  percentage: 20,
  previousBuyerCount: 8,
  previousPercentage: 16,
  countChangePercentage: 25,
  ...overrides,
})

describe("buildGrowthMarkets", () => {
  it("excludes cities with no prior-period data (null countChangePercentage)", () => {
    const result = buildGrowthMarkets([
      city({ city: "A", countChangePercentage: 10 }),
      city({ city: "B", countChangePercentage: null }),
    ])
    expect(result.map((c) => c.city)).toEqual(["A"])
  })

  it("sorts by change percentage descending", () => {
    const result = buildGrowthMarkets([
      city({ city: "Low", countChangePercentage: 5 }),
      city({ city: "High", countChangePercentage: 40 }),
      city({ city: "Mid", countChangePercentage: 20 }),
    ])
    expect(result.map((c) => c.city)).toEqual(["High", "Mid", "Low"])
  })

  it("returns at most the top 3 markets", () => {
    const cities = Array.from({ length: 5 }, (_, i) => city({ city: `City ${i}`, countChangePercentage: i }))
    expect(buildGrowthMarkets(cities)).toHaveLength(3)
  })

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a non-array object", { city: "x" } as unknown as VendorGeographicCity[]],
  ])("returns an empty array instead of crashing when cities is %s", (_label, value) => {
    expect(buildGrowthMarkets(value)).toEqual([])
  })
})
