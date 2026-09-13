import { describe, expect, it, vi } from "vitest"
import { buildRelatedProductSteps, type RelatedProductItem, resolveRelatedProducts } from "./resolve-related-products"

function item(id: string): RelatedProductItem {
  return { productId: id, productName: id, price: 1 }
}

describe("buildRelatedProductSteps", () => {
  it("walks a 3-level path from deepest to shallowest, ending with null", () => {
    expect(buildRelatedProductSteps("A > B > C")).toEqual(["A > B > C", "A > B", "A", null])
  })

  it("is just [null] when there is no category", () => {
    expect(buildRelatedProductSteps(undefined)).toEqual([null])
  })

  it("is [path, null] for a single-segment path", () => {
    expect(buildRelatedProductSteps("A")).toEqual(["A", null])
  })
})

describe("resolveRelatedProducts", () => {
  it("fills entirely from the leaf category when it has enough items", async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce({
      content: [item("cur"), item("x1"), item("x2"), item("x3"), item("x4")],
    })

    const result = await resolveRelatedProducts({
      productId: "cur",
      leafCategoryPath: "A > B > C",
      fetchPage,
    })

    expect(result.map((p) => p.productId)).toEqual(["x1", "x2", "x3", "x4"])
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(fetchPage).toHaveBeenCalledWith(5, ["A > B > C"])
  })

  it("accumulates across the leaf and its parent", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ content: [item("x1"), item("x2")] })
      .mockResolvedValueOnce({ content: [item("x1"), item("x2"), item("y1"), item("y2"), item("y3")] })

    const result = await resolveRelatedProducts({
      productId: "cur",
      leafCategoryPath: "A > B > C",
      fetchPage,
    })

    expect(result.map((p) => p.productId)).toEqual(["x1", "x2", "y1", "y2"])
    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(fetchPage).toHaveBeenNthCalledWith(2, 3, ["A > B"])
  })

  it("walks all the way to the unfiltered global step when needed", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ content: [item("x1")] })
      .mockResolvedValueOnce({ content: [item("x1"), item("y1")] })
      .mockResolvedValueOnce({ content: [item("x1"), item("y1")] })
      .mockResolvedValueOnce({ content: [item("x1"), item("y1"), item("z1"), item("z2"), item("z3")] })

    const result = await resolveRelatedProducts({
      productId: "cur",
      leafCategoryPath: "A > B > C",
      fetchPage,
    })

    expect(fetchPage).toHaveBeenCalledTimes(4)
    expect(fetchPage).toHaveBeenLastCalledWith(expect.any(Number), undefined)
    expect(result).toHaveLength(4)
    expect(result.map((p) => p.productId)).toEqual(["x1", "y1", "z1", "z2"])
  })

  it("excludes the current product at every step", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ content: [item("cur"), item("x1")] })
      .mockResolvedValueOnce({ content: [item("cur"), item("x1")] })
      .mockResolvedValueOnce({ content: [item("cur"), item("x1")] })
      .mockResolvedValueOnce({ content: [item("cur"), item("x1"), item("z1"), item("z2")] })

    const result = await resolveRelatedProducts({
      productId: "cur",
      leafCategoryPath: "A > B > C",
      fetchPage,
    })

    expect(result.some((p) => p.productId === "cur")).toBe(false)
  })

  it("makes a single unfiltered call when there is no category", async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce({ content: [item("x1")] })

    await resolveRelatedProducts({ productId: "cur", fetchPage })

    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(fetchPage).toHaveBeenCalledWith(5, undefined)
  })

  it("returns what was collected so far when a later step fails", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ content: [item("x1"), item("x2")] })
      .mockRejectedValueOnce(new Error("boom"))

    const result = await resolveRelatedProducts({
      productId: "cur",
      leafCategoryPath: "A > B > C",
      fetchPage,
    })

    expect(result.map((p) => p.productId)).toEqual(["x1", "x2"])
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it("returns an empty list when the very first step fails", async () => {
    const fetchPage = vi.fn().mockRejectedValueOnce(new Error("boom"))

    const result = await resolveRelatedProducts({
      productId: "cur",
      leafCategoryPath: "A > B > C",
      fetchPage,
    })

    expect(result).toEqual([])
  })

  it("treats a missing content field as empty and continues to the next step", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ content: [item("x1")] })
      .mockResolvedValueOnce({ content: [item("x1")] })
      .mockResolvedValueOnce({ content: [item("x1"), item("z1"), item("z2"), item("z3")] })

    const result = await resolveRelatedProducts({
      productId: "cur",
      leafCategoryPath: "A > B > C",
      fetchPage,
    })

    expect(result.map((p) => p.productId)).toEqual(["x1", "z1", "z2", "z3"])
  })

  it("respects a custom target", async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce({ content: [item("x1"), item("x2"), item("x3")] })

    const result = await resolveRelatedProducts({
      productId: "cur",
      leafCategoryPath: "A > B > C",
      target: 2,
      fetchPage,
    })

    expect(result).toHaveLength(2)
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(fetchPage).toHaveBeenCalledWith(3, ["A > B > C"])
  })
})
