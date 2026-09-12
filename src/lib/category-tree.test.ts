import { describe, expect, it } from "vitest"
import {
  categoryPathToLevels,
  formatLegacyCategory,
  getChildren,
  isLeafPath,
  LEAF_PATHS,
  levelsToCategoryPath,
  ROOT_CATEGORY,
  searchLeafPaths,
} from "./category-tree"

describe("category-tree counts", () => {
  it("has 41 root categories", () => {
    expect(getChildren([]).length).toBe(41)
  })

  it("has 805 leaf paths", () => {
    expect(LEAF_PATHS.length).toBe(805)
  })

  it("has a max depth of 4", () => {
    const maxDepth = Math.max(...LEAF_PATHS.map((entry) => entry.path.length))
    expect(maxDepth).toBe(4)
  })

  it("has leaves distributed 422/356/27 across depths 2/3/4", () => {
    const byDepth = new Map<number, number>()
    for (const entry of LEAF_PATHS) {
      byDepth.set(entry.path.length, (byDepth.get(entry.path.length) ?? 0) + 1)
    }

    expect(byDepth.get(2)).toBe(422)
    expect(byDepth.get(3)).toBe(356)
    expect(byDepth.get(4)).toBe(27)
  })
})

describe("duplicate names resolve by full path", () => {
  it("distinguishes Accessories under Instruments (non-leaf) from Accessories under Infection control (leaf)", () => {
    expect(isLeafPath(["Instruments", "Accessories"])).toBe(false)
    expect(isLeafPath(["Infection control - clinical products", "Accessories"])).toBe(true)
  })

  it("treats both Replacement plunger paths as leaves", () => {
    expect(isLeafPath(["Impression materials", "Impression material accessories", "Replacement plunger"])).toBe(true)
    expect(isLeafPath(["Impression materials", "Syringe tips & parts", "Replacement plunger"])).toBe(true)
  })
})

describe("getChildren", () => {
  it("returns the known children for an existing non-leaf path", () => {
    const children = getChildren(["Endodontic products"]).map((node) => node.name)
    expect(children).toContain("Endodontic sealers & cements")
    expect(children).toContain("Medicaments")
  })

  it("returns an empty array for an unknown path", () => {
    expect(getChildren(["Not a real category"])).toEqual([])
    expect(getChildren(["Endodontic products", "Not a real child"])).toEqual([])
  })
})

describe("categoryPathToLevels", () => {
  it("maps a 3-deep leaf path to categoryLevel2..4 and omits categoryLevel5", () => {
    const path = ["Endodontic products", "Hand files-reamers-hedstroms", "K-Files"]
    const levels = categoryPathToLevels(path)

    expect(levels).toEqual({
      categoryLevel1: "Dental Supplies",
      categoryLevel2: "Endodontic products",
      categoryLevel3: "Hand files-reamers-hedstroms",
      categoryLevel4: "K-Files",
    })
    expect(levels).not.toHaveProperty("categoryLevel5")
  })

  it("maps a 4-deep leaf path to categoryLevel2..5", () => {
    const path = [
      "Acrylics, reline & tray materials",
      "Acrylic accessories",
      "Mixing dispensers and accessories",
      "Mixing tips",
    ]
    const levels = categoryPathToLevels(path)

    expect(levels).toEqual({
      categoryLevel1: "Dental Supplies",
      categoryLevel2: "Acrylics, reline & tray materials",
      categoryLevel3: "Acrylic accessories",
      categoryLevel4: "Mixing dispensers and accessories",
      categoryLevel5: "Mixing tips",
    })
  })
})

describe("levelsToCategoryPath roundtrip", () => {
  it("roundtrips the 3-deep example", () => {
    const path = ["Endodontic products", "Hand files-reamers-hedstroms", "K-Files"]
    expect(levelsToCategoryPath(categoryPathToLevels(path))).toEqual(path)
  })

  it("roundtrips the 4-deep example", () => {
    const path = [
      "Acrylics, reline & tray materials",
      "Acrylic accessories",
      "Mixing dispensers and accessories",
      "Mixing tips",
    ]
    expect(levelsToCategoryPath(categoryPathToLevels(path))).toEqual(path)
  })
})

describe("levelsToCategoryPath rejects invalid input", () => {
  it("returns null for the wrong root category", () => {
    expect(
      levelsToCategoryPath({
        categoryLevel1: "Medical Supplies",
        categoryLevel2: "Endodontic products",
      }),
    ).toBeNull()
  })

  it("returns null when the path stops at a non-leaf node", () => {
    expect(
      levelsToCategoryPath({
        categoryLevel1: ROOT_CATEGORY,
        categoryLevel2: "Endodontic products",
        categoryLevel3: "Medicaments",
      }),
    ).toBeNull()
  })

  it("returns null for an off-tree value", () => {
    expect(
      levelsToCategoryPath({
        categoryLevel1: ROOT_CATEGORY,
        categoryLevel2: "Not a real category",
      }),
    ).toBeNull()
  })

  it("returns null when all levels are empty", () => {
    expect(levelsToCategoryPath({})).toBeNull()
  })

  it("returns null when categoryLevel1 is present but categoryLevel2 is missing", () => {
    expect(levelsToCategoryPath({ categoryLevel1: ROOT_CATEGORY })).toBeNull()
  })
})

describe("formatLegacyCategory", () => {
  it("joins non-empty levels with ' > '", () => {
    expect(
      formatLegacyCategory({
        categoryLevel1: ROOT_CATEGORY,
        categoryLevel2: "Endodontic products",
        categoryLevel3: "Hand files-reamers-hedstroms",
        categoryLevel4: "K-Files",
      }),
    ).toBe("Dental Supplies > Endodontic products > Hand files-reamers-hedstroms > K-Files")
  })

  it("skips blank or whitespace-only levels", () => {
    expect(
      formatLegacyCategory({
        categoryLevel1: ROOT_CATEGORY,
        categoryLevel2: "  ",
        categoryLevel3: "Medicaments",
        categoryLevel4: "",
      }),
    ).toBe("Dental Supplies > Medicaments")
  })

  it("returns null when all levels are empty", () => {
    expect(formatLegacyCategory({})).toBeNull()
    expect(formatLegacyCategory({ categoryLevel1: "  ", categoryLevel2: "" })).toBeNull()
  })

  it("does not require membership in the tree", () => {
    expect(
      formatLegacyCategory({
        categoryLevel1: ROOT_CATEGORY,
        categoryLevel2: "Not a real category",
      }),
    ).toBe("Dental Supplies > Not a real category")
  })
})

describe("searchLeafPaths", () => {
  it("finds the K-Files entry (case-insensitive)", () => {
    const lower = searchLeafPaths("k-files")
    const upper = searchLeafPaths("K-FILES")

    expect(lower.some((entry) => entry.label.endsWith("K-Files"))).toBe(true)
    expect(upper.some((entry) => entry.label.endsWith("K-Files"))).toBe(true)
  })

  it("requires every token to match (multi-token query)", () => {
    const results = searchLeafPaths("endodontic hand")

    expect(results.length).toBeGreaterThan(0)
    for (const entry of results) {
      const label = entry.label.toLowerCase()
      expect(label).toContain("endodontic")
      expect(label).toContain("hand")
    }
  })

  it("returns an empty array for an empty or whitespace-only query", () => {
    expect(searchLeafPaths("")).toEqual([])
    expect(searchLeafPaths("   ")).toEqual([])
  })

  it("respects the limit parameter", () => {
    expect(searchLeafPaths("a", 5).length).toBe(5)
  })

  it("returns an empty array when nothing matches", () => {
    expect(searchLeafPaths("zzzzzznotarealcategory")).toEqual([])
  })
})
