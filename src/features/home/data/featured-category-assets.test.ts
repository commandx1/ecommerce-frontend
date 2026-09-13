import { Package } from "lucide-react"
import { describe, expect, it } from "vitest"
import categoryTree from "@/data/category_tree.json"
import {
  FEATURED_CATEGORY_FALLBACK,
  FEATURED_CATEGORY_ICONS,
  getFeaturedCategoryAsset,
} from "./featured-category-assets"

describe("featured-category-assets", () => {
  it("maps every icon key to a real top-level category_tree.json root", () => {
    const rootNames = new Set(categoryTree.map((category) => category.name))

    for (const key of Object.keys(FEATURED_CATEGORY_ICONS)) {
      expect(rootNames.has(key)).toBe(true)
    }
  })

  it("has exactly 41 keys", () => {
    expect(Object.keys(FEATURED_CATEGORY_ICONS)).toHaveLength(41)
  })

  it("returns the mapped icon for a known category", () => {
    expect(getFeaturedCategoryAsset("Disposables").icon).toBe(Package)
  })

  it("falls back to the default icon for an unknown category", () => {
    expect(getFeaturedCategoryAsset("Not a category").icon).toBe(FEATURED_CATEGORY_FALLBACK.icon)
  })
})
