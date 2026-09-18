import { describe, expect, it } from "vitest"
import { getChildren } from "@/lib/category-tree"
import { buildCategoryDirectory, categoryHref, DIRECTORY_CHILD_LIMIT, filterEntries } from "./build-category-directory"

const ROOT_COUNT = getChildren([]).length

describe("buildCategoryDirectory", () => {
  it(`returns all ${ROOT_COUNT} level-2 categories, alphabetical when nothing is stocked`, () => {
    const entries = buildCategoryDirectory([])
    expect(entries).toHaveLength(ROOT_COUNT)
    const taxonomyNames = getChildren([]).map((node) => node.name)
    expect(entries.map((entry) => entry.name)).toEqual([...taxonomyNames].sort((a, b) => a.localeCompare(b, "en")))
  })

  it("puts stocked categories first by count desc, ties alphabetical, then empty ones alphabetical", () => {
    const entries = buildCategoryDirectory([
      { name: "Instruments > Forceps", count: 3 },
      { name: "Preventives > Fluoride", count: 3 },
      { name: "Endodontic products > Files", count: 10 },
    ])
    expect(entries.slice(0, 3).map((entry) => entry.name)).toEqual([
      "Endodontic products",
      "Instruments",
      "Preventives",
    ])
    const rest = entries.slice(3)
    expect(rest.every((entry) => entry.count === 0)).toBe(true)
    expect(rest.map((entry) => entry.name)).toEqual(
      rest.map((entry) => entry.name).sort((a, b) => a.localeCompare(b, "en")),
    )
  })

  it("defaults counts to 0 for unknown/empty options", () => {
    const entries = buildCategoryDirectory([])
    expect(entries.every((entry) => entry.count === 0)).toBe(true)

    const unknownEntries = buildCategoryDirectory([{ name: "Nonexistent > Path", count: 5 }])
    expect(unknownEntries.every((entry) => entry.count === 0)).toBe(true)
  })

  it("merges counts from options across descendants", () => {
    const entries = buildCategoryDirectory([
      { name: "Instruments > Forceps", count: 3 },
      { name: "Instruments > Scalers", count: 2 },
    ])
    const instruments = entries.find((entry) => entry.name === "Instruments")
    expect(instruments?.count).toBe(5)
  })

  it("caps children at the directory limit", () => {
    const entries = buildCategoryDirectory([])
    for (const entry of entries) {
      expect(entry.children.length).toBeLessThanOrEqual(DIRECTORY_CHILD_LIMIT)
    }
  })
})

describe("filterEntries", () => {
  const entries = buildCategoryDirectory([])

  it("returns all entries for a blank query", () => {
    expect(filterEntries(entries, "   ")).toEqual(entries)
  })

  it("matches child names case-insensitively", () => {
    const target = entries.find((entry) => entry.children.length > 0)
    if (!target) throw new Error("expected an entry with children for this fixture")
    const child = target.children[0]
    const results = filterEntries(entries, child.toUpperCase())
    expect(results.some((entry) => entry.name === target.name)).toBe(true)
  })

  it("matches the category name itself", () => {
    const results = filterEntries(entries, "instruments")
    expect(results.some((entry) => entry.name === "Instruments")).toBe(true)
  })
})

describe("categoryHref", () => {
  it("builds a single-segment href", () => {
    expect(categoryHref("Instruments")).toBe("/products?categories=Instruments")
  })

  it("joins and encodes multi-segment paths", () => {
    expect(categoryHref("Instruments", "Forceps")).toBe("/products?categories=Instruments%20%3E%20Forceps")
  })
})
