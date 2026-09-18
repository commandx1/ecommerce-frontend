import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import categoryTree from "@/data/category_tree.json"
import {
  FEATURED_CATEGORY_FALLBACK,
  FEATURED_CATEGORY_FALLBACK_IMAGE,
  FEATURED_CATEGORY_IMAGES,
  getFeaturedCategoryAsset,
} from "./featured-category-assets"

describe("featured-category-assets", () => {
  it("maps every image key to a real top-level category_tree.json root", () => {
    const rootNames = new Set(categoryTree.map((category) => category.name))

    for (const key of Object.keys(FEATURED_CATEGORY_IMAGES)) {
      expect(rootNames.has(key)).toBe(true)
    }
  })

  it("has exactly 41 keys", () => {
    expect(Object.keys(FEATURED_CATEGORY_IMAGES)).toHaveLength(41)
  })

  it("maps every category_tree.json root to an image key", () => {
    const rootNames = categoryTree.map((category) => category.name)

    for (const name of rootNames) {
      expect(Object.hasOwn(FEATURED_CATEGORY_IMAGES, name)).toBe(true)
    }
  })

  it("points every image path at a file that exists under public/", () => {
    for (const imagePath of Object.values(FEATURED_CATEGORY_IMAGES)) {
      const absolutePath = join(process.cwd(), "public", imagePath)
      expect(existsSync(absolutePath)).toBe(true)
    }

    expect(existsSync(join(process.cwd(), "public", FEATURED_CATEGORY_FALLBACK_IMAGE))).toBe(true)
  })

  it("returns the mapped image for a known category", () => {
    expect(getFeaturedCategoryAsset("Disposables").image).toBe(FEATURED_CATEGORY_IMAGES.Disposables)
  })

  it("falls back to the default image for an unknown category", () => {
    expect(getFeaturedCategoryAsset("Not a category").image).toBe(FEATURED_CATEGORY_FALLBACK_IMAGE)
    expect(getFeaturedCategoryAsset("Not a category")).toEqual(FEATURED_CATEGORY_FALLBACK)
  })
})
