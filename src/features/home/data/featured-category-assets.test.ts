import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import categoryTree from "@/data/category_tree.json"
import {
  FEATURED_CATEGORY_FALLBACK,
  FEATURED_CATEGORY_FALLBACK_IMAGE,
  FEATURED_CATEGORY_IMAGES,
  getFeaturedCategoryAsset,
  toThumbPath,
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

  it("points every image and thumb path at a file that exists under public/", () => {
    for (const imagePath of [...Object.values(FEATURED_CATEGORY_IMAGES), FEATURED_CATEGORY_FALLBACK_IMAGE]) {
      expect(existsSync(join(process.cwd(), "public", imagePath))).toBe(true)
      expect(existsSync(join(process.cwd(), "public", toThumbPath(imagePath)))).toBe(true)
    }
  })

  it("returns the mapped image and its 600px thumb for a known category", () => {
    expect(getFeaturedCategoryAsset("Disposables")).toEqual({
      image: FEATURED_CATEGORY_IMAGES.Disposables,
      thumb: "/categories/disposables-600.webp",
    })
  })

  it("falls back to the default image for an unknown category", () => {
    expect(getFeaturedCategoryAsset("Not a category").image).toBe(FEATURED_CATEGORY_FALLBACK_IMAGE)
    expect(getFeaturedCategoryAsset("Not a category")).toEqual(FEATURED_CATEGORY_FALLBACK)
  })
})
