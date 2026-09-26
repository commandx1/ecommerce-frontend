import { describe, expect, it, vi } from "vitest"
import { CATEGORY_COUNTS_TAG } from "@/lib/cache/category-counts"

const cacheSpies = vi.hoisted(() => ({
  updateTag: vi.fn(),
}))
vi.mock("next/cache", () => ({ updateTag: cacheSpies.updateTag }))

import { revalidateCategoryCounts } from "./revalidate-category-counts"

describe("revalidateCategoryCounts", () => {
  it("calls updateTag with the shared category-counts tag", async () => {
    await revalidateCategoryCounts()

    expect(cacheSpies.updateTag).toHaveBeenCalledTimes(1)
    expect(cacheSpies.updateTag).toHaveBeenCalledWith(CATEGORY_COUNTS_TAG)
  })

  it("swallows an error from updateTag instead of throwing", async () => {
    cacheSpies.updateTag.mockImplementationOnce(() => {
      throw new Error("no action context")
    })

    await expect(revalidateCategoryCounts()).resolves.toBeUndefined()
  })
})
