import { describe, expect, it } from "vitest"
import { MAX_PAGE_SIZE } from "../../server/parse-listing-search-params"
import { PAGE_SIZE_OPTIONS } from "./PaginationBar"

describe("PaginationBar — page size contract", () => {
  it("matches the backend public listing cap (ProductController.MAX_PUBLIC_PRODUCT_PAGE_SIZE)", () => {
    expect(MAX_PAGE_SIZE).toBe(30)
  })

  it("never offers a page size option above MAX_PAGE_SIZE", () => {
    for (const option of PAGE_SIZE_OPTIONS) {
      expect(option).toBeLessThanOrEqual(MAX_PAGE_SIZE)
    }
  })
})
