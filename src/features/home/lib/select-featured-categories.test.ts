import { describe, expect, it } from "vitest"
import type { FilterOption } from "@/lib/api/public-products"
import { selectFeaturedCategories } from "./select-featured-categories"

describe("selectFeaturedCategories", () => {
  it("sorts roots by rolled-up count descending, tie-breaking alphabetically", () => {
    const options: FilterOption[] = [
      { name: "Disposables > Air-Water syringe tips", count: 11 },
      { name: "Infection control - personal products > Gloves", count: 11 },
      { name: "Cosmetic dentistry products > Composites including resins & hybrids", count: 4 },
      { name: "Endodontic products > Endodontic sealers & cements", count: 2 },
      { name: "Endodontic products > Endodontic accessories > Endo organizers & accessories", count: 1 },
      { name: "Cements, liners & adhesives > Cement", count: 2 },
    ]

    const result = selectFeaturedCategories(options)

    expect(result.map((c) => c.name)).toEqual([
      "Disposables",
      "Infection control - personal products",
      "Cosmetic dentistry products",
      "Endodontic products",
      "Cements, liners & adhesives",
    ])
    expect(result.map((c) => c.count)).toEqual([11, 11, 4, 3, 2])
  })

  it("returns fewer than limit items when fewer roots have a nonzero count", () => {
    const options: FilterOption[] = [{ name: "Disposables > Air-Water syringe tips", count: 3 }]

    const result = selectFeaturedCategories(options)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Disposables")
    expect(result[0].count).toBe(3)
  })

  it("truncates to the given limit", () => {
    const options: FilterOption[] = [
      { name: "Disposables > Air-Water syringe tips", count: 5 },
      { name: "Instruments > Mirrors", count: 4 },
      { name: "Equipment > Chairs", count: 3 },
    ]

    const result = selectFeaturedCategories(options, 2)

    expect(result).toHaveLength(2)
    expect(result.map((c) => c.name)).toEqual(["Disposables", "Instruments"])
  })

  it("returns an empty array for empty input", () => {
    expect(selectFeaturedCategories([])).toEqual([])
  })

  it("excludes roots that end up with zero count", () => {
    const options: FilterOption[] = [{ name: "Disposables > Air-Water syringe tips", count: 3 }]

    const result = selectFeaturedCategories(options)

    expect(result.some((c) => c.name === "Instruments")).toBe(false)
  })

  it("orders topChildren by count descending and caps at 3", () => {
    const options: FilterOption[] = [
      { name: "Endodontic products > A", count: 1 },
      { name: "Endodontic products > B", count: 5 },
      { name: "Endodontic products > C", count: 3 },
      { name: "Endodontic products > D", count: 2 },
    ]

    const result = selectFeaturedCategories(options)

    expect(result[0].name).toBe("Endodontic products")
    expect(result[0].topChildren).toEqual(["B", "C", "D"])
  })

  it("counts a path not present in the taxonomy under its own root", () => {
    const options: FilterOption[] = [{ name: "Some New Category > Something Else", count: 6 }]

    const result = selectFeaturedCategories(options)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ name: "Some New Category", count: 6, topChildren: ["Something Else"] })
  })

  it("does not mutate the input options array", () => {
    const options: FilterOption[] = [
      { name: "Disposables > Air-Water syringe tips", count: 5 },
      { name: "Instruments > Mirrors", count: 4 },
    ]
    const snapshot = JSON.parse(JSON.stringify(options))

    selectFeaturedCategories(options)

    expect(options).toEqual(snapshot)
  })
})
