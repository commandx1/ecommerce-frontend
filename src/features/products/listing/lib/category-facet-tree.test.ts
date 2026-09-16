import { describe, expect, it } from "vitest"
import type { FilterOption } from "@/lib/api/public-products"
import {
  ancestorsOf,
  buildCategoryFacetTree,
  type CategoryFacetNode,
  collectBranchPaths,
  filterTreeByQuery,
  isSameOrDescendant,
  splitCategoryPath,
  toggleCategorySelection,
} from "./category-facet-tree"

function findNode(nodes: CategoryFacetNode[], fullPath: string): CategoryFacetNode | undefined {
  for (const node of nodes) {
    if (node.fullPath === fullPath) {
      return node
    }
    const found = findNode(node.children, fullPath)
    if (found) {
      return found
    }
  }
  return undefined
}

describe("splitCategoryPath", () => {
  it("trims segments and drops empty ones", () => {
    expect(splitCategoryPath("Endodontic products > Endodontic sealers & cements")).toEqual([
      "Endodontic products",
      "Endodontic sealers & cements",
    ])
  })

  it("drops empty segments from stray separators", () => {
    expect(splitCategoryPath("A >  > B")).toEqual(["A", "B"])
  })

  it("returns an empty array for a blank string", () => {
    expect(splitCategoryPath("   ")).toEqual([])
  })
})

describe("ancestorsOf", () => {
  it("returns strict ancestors, shortest first", () => {
    expect(ancestorsOf("A > B > C")).toEqual(["A", "A > B"])
  })

  it("returns an empty array for a single-segment path", () => {
    expect(ancestorsOf("A")).toEqual([])
  })
})

describe("isSameOrDescendant", () => {
  it("is true for the same path", () => {
    expect(isSameOrDescendant("A > B", "A > B")).toBe(true)
  })

  it("is true for a deeper descendant", () => {
    expect(isSameOrDescendant("A > B > C", "A > B")).toBe(true)
  })

  it("is false for a sibling that merely shares a string prefix", () => {
    expect(isSameOrDescendant("A > BC", "A > B")).toBe(false)
  })

  it("is false when candidate is shallower than ancestor", () => {
    expect(isSameOrDescendant("A", "A > B")).toBe(false)
  })
})

describe("buildCategoryFacetTree", () => {
  it("preserves JSON root order regardless of options order", () => {
    const options: FilterOption[] = [
      { name: "Instruments > Diagnostic instruments > Mouth mirrors > Mirror only", count: 2 },
      { name: "Endodontic products > Endodontic sealers & cements", count: 5 },
      { name: "Cosmetic dentistry products", count: 1 },
    ]

    const tree = buildCategoryFacetTree(options)
    const labels = tree.map((node) => node.label)
    const endoIndex = labels.indexOf("Endodontic products")
    const cosmeticIndex = labels.indexOf("Cosmetic dentistry products")
    const instrumentsIndex = labels.indexOf("Instruments")

    expect(endoIndex).toBeGreaterThanOrEqual(0)
    expect(endoIndex).toBeLessThan(cosmeticIndex)
    expect(cosmeticIndex).toBeLessThan(instrumentsIndex)
  })

  it("prunes taxonomy siblings that have no counted descendants", () => {
    const options: FilterOption[] = [{ name: "Endodontic products > Endodontic sealers & cements", count: 5 }]

    const tree = buildCategoryFacetTree(options)
    const endo = findNode(tree, "Endodontic products")
    expect(endo).toBeDefined()

    const childLabels = endo?.children.map((child) => child.label) ?? []
    expect(childLabels).toEqual(["Endodontic sealers & cements"])
    expect(childLabels).not.toContain("Medicaments")
  })

  it("rolls up leaf counts into the root", () => {
    const options: FilterOption[] = [
      { name: "Endodontic products > Endodontic sealers & cements", count: 5 },
      { name: "Endodontic products > Endodontic accessories > Endo organizers & accessories", count: 3 },
    ]

    const tree = buildCategoryFacetTree(options)
    const endo = findNode(tree, "Endodontic products")
    expect(endo?.count).toBe(8)

    const accessories = findNode(tree, "Endodontic products > Endodontic accessories")
    expect(accessories?.count).toBe(3)

    const organizers = findNode(tree, "Endodontic products > Endodontic accessories > Endo organizers & accessories")
    expect(organizers?.count).toBe(3)
    expect(organizers?.children).toEqual([])
  })

  it("supports a depth-4 leaf path", () => {
    const options: FilterOption[] = [
      { name: "Instruments > Diagnostic instruments > Mouth mirrors > Mirror only", count: 4 },
    ]

    const tree = buildCategoryFacetTree(options)
    const leaf = findNode(tree, "Instruments > Diagnostic instruments > Mouth mirrors > Mirror only")
    expect(leaf?.count).toBe(4)

    const root = findNode(tree, "Instruments")
    expect(root?.count).toBe(4)
  })

  it("sums a root-level option with a deeper option under the same root", () => {
    const options: FilterOption[] = [
      { name: "Disposables", count: 3 },
      { name: "Infection control - personal products > Gloves", count: 2 },
    ]

    // Use a root ("Disposables") that also receives its own direct count, alongside an
    // unrelated deeper leaf to make sure only the relevant subtree accumulates.
    const tree = buildCategoryFacetTree(options)
    const disposables = findNode(tree, "Disposables")
    expect(disposables?.count).toBe(3)
    expect(disposables?.children).toEqual([])

    const gloves = findNode(tree, "Infection control - personal products > Gloves")
    expect(gloves?.count).toBe(2)
  })

  it("appends out-of-taxonomy paths after taxonomy roots and rolls up their counts", () => {
    const options: FilterOption[] = [
      { name: "Endodontic products > Endodontic sealers & cements", count: 5 },
      { name: "Consumables > Impression > Tips", count: 7 },
    ]

    const tree = buildCategoryFacetTree(options)
    const labels = tree.map((node) => node.label)
    const endoIndex = labels.indexOf("Endodontic products")
    const consumablesIndex = labels.indexOf("Consumables")

    expect(consumablesIndex).toBeGreaterThan(endoIndex)

    const consumables = findNode(tree, "Consumables")
    expect(consumables?.count).toBe(7)

    const impression = findNode(tree, "Consumables > Impression")
    expect(impression?.count).toBe(7)

    const tips = findNode(tree, "Consumables > Impression > Tips")
    expect(tips?.count).toBe(7)
    expect(tips?.children).toEqual([])
  })

  it("ignores options with empty or blank names", () => {
    const options: FilterOption[] = [
      { name: "   ", count: 10 },
      { name: "Endodontic products > Endodontic sealers & cements", count: 5 },
    ]

    const tree = buildCategoryFacetTree(options)
    const totalCount = tree.reduce((sum, node) => sum + node.count, 0)
    expect(totalCount).toBe(5)
  })

  it("sums duplicate paths", () => {
    const options: FilterOption[] = [
      { name: "Infection control - personal products > Gloves", count: 2 },
      { name: "Infection control - personal products > Gloves", count: 3 },
    ]

    const tree = buildCategoryFacetTree(options)
    const gloves = findNode(tree, "Infection control - personal products > Gloves")
    expect(gloves?.count).toBe(5)
  })
})

describe("filterTreeByQuery", () => {
  const options: FilterOption[] = [
    { name: "Endodontic products > Endodontic sealers & cements", count: 5 },
    { name: "Endodontic products > Endodontic accessories > Endo organizers & accessories", count: 3 },
    { name: "Infection control - personal products > Gloves", count: 2 },
  ]

  it("returns the same tree reference for an empty query", () => {
    const tree = buildCategoryFacetTree(options)
    expect(filterTreeByQuery(tree, "")).toBe(tree)
    expect(filterTreeByQuery(tree, "   ")).toBe(tree)
  })

  it("matches case-insensitively and keeps the matching node's full children", () => {
    const tree = buildCategoryFacetTree(options)
    const filtered = filterTreeByQuery(tree, "endodontic products")

    const endo = findNode(filtered, "Endodontic products")
    expect(endo).toBeDefined()
    expect(endo?.children.length).toBe(2)
    expect(findNode(filtered, "Infection control - personal products")).toBeUndefined()
  })

  it("keeps ancestors of a deep match without pruning the matching node's own children", () => {
    const tree = buildCategoryFacetTree(options)
    const filtered = filterTreeByQuery(tree, "gloves")

    const infection = findNode(filtered, "Infection control - personal products")
    expect(infection).toBeDefined()
    expect(infection?.children.map((child) => child.label)).toEqual(["Gloves"])
  })
})

describe("toggleCategorySelection", () => {
  const branchOptions: FilterOption[] = [
    { name: "A > B", count: 1 },
    { name: "A > C > D", count: 1 },
    { name: "A > C > E", count: 1 },
  ]
  const branchTree = buildCategoryFacetTree(branchOptions)

  const onlyChildOptions: FilterOption[] = [
    { name: "A > B", count: 1 },
    { name: "A > C > D", count: 1 },
  ]
  const onlyChildTree = buildCategoryFacetTree(onlyChildOptions)

  it("deselects an already-selected path", () => {
    expect(toggleCategorySelection(branchTree, ["A"], "A")).toEqual([])
  })

  it("excludes one child under a selected root by expanding siblings", () => {
    expect(toggleCategorySelection(branchTree, ["A"], "A > C > D")).toEqual(["A > B", "A > C > E"])
  })

  it("drops the whole branch when the excluded child was an only child", () => {
    expect(toggleCategorySelection(onlyChildTree, ["A"], "A > C > D")).toEqual(["A > B"])
  })

  it("re-selecting the excluded child merges the branch back up to the root", () => {
    const afterExclude = toggleCategorySelection(branchTree, ["A"], "A > C > D")
    expect(afterExclude).toEqual(["A > B", "A > C > E"])

    const afterReselect = toggleCategorySelection(branchTree, afterExclude, "A > C > D")
    expect(afterReselect).toEqual(["A"])
  })

  it("selecting a parent drops already-selected descendants", () => {
    expect(toggleCategorySelection(branchTree, ["A > B"], "A")).toEqual(["A"])
  })

  it("plain deselect removes only the given path", () => {
    expect(toggleCategorySelection(branchTree, ["A > B", "A > C > D"], "A > B")).toEqual(["A > C > D"])
  })
})

describe("collectBranchPaths", () => {
  it("lists only nodes that have children", () => {
    const options: FilterOption[] = [
      { name: "Endodontic products > Endodontic sealers & cements", count: 5 },
      { name: "Infection control - personal products > Gloves", count: 2 },
    ]

    const tree = buildCategoryFacetTree(options)
    const branchPaths = collectBranchPaths(tree)

    expect(branchPaths).toContain("Endodontic products")
    expect(branchPaths).toContain("Infection control - personal products")
    expect(branchPaths).not.toContain("Endodontic products > Endodontic sealers & cements")
    expect(branchPaths).not.toContain("Infection control - personal products > Gloves")
  })
})
