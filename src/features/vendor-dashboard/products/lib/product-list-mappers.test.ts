import { describe, expect, it } from "vitest"
import type { VendorProductReviewItem } from "@/lib/api/products"
import { makeProduct, makeUserProductDetailResponse, makeVendorUserProduct } from "@/test/factories"
import type { ProductWithDetails } from "../types"
import { mapFilterProductsToRows, mapReviewItemsToRows, patchProductRow } from "./product-list-mappers"

describe("mapFilterProductsToRows", () => {
  it("carries every user-product field through unchanged and resolves the image URL", () => {
    const userProduct = makeVendorUserProduct({ productName: "Mixing Tips", coverPhotoPath: "/uploads/tips.png" })

    const [row] = mapFilterProductsToRows([userProduct])

    expect(row).toMatchObject({
      id: userProduct.id,
      productName: "Mixing Tips",
      price: userProduct.price,
      discount: userProduct.discount,
      stock: userProduct.stock,
    })
    expect(row?.image).toContain("tips.png")
    expect(row?.product?.name).toBe("Mixing Tips")
  })

  it("leaves the image undefined for a product without a cover photo", () => {
    const [row] = mapFilterProductsToRows([makeVendorUserProduct({ coverPhotoPath: "" })])
    expect(row?.image).toBeUndefined()
  })
})

describe("mapReviewItemsToRows", () => {
  const reviewItem = (overrides: Partial<VendorProductReviewItem> = {}): VendorProductReviewItem => ({
    product: makeProduct({ id: "p-9", name: "Heavy Product" }),
    reviewStatus: {
      id: "rev-9",
      approved: null,
      rejectedReason: null,
      lastReviewedByAdminId: null,
      updatedDate: "2026-01-10T09:00:00Z",
    },
    userProduct: makeUserProductDetailResponse({
      id: "up-9",
      productId: "p-9",
      productName: "Heavy Product",
      shipmentFee: 25,
      heavyShippingSurcharge: 75,
      skuCode: "SKU-REAL",
    }),
    ...overrides,
  })

  it("drops review items the backend returns without a user product", () => {
    const rows = mapReviewItemsToRows([reviewItem({ userProduct: undefined })])
    expect(rows).toEqual([])
  })

  /**
   * REGRESSION GUARD (K13): the review-queue mapping used to copy only a subset of the user
   * product, dropping `skuCode`, `shipmentFee` and `heavyShippingSurcharge`.
   */
  it("carries the real shipping fees and SKU through from the user product", () => {
    const [row] = mapReviewItemsToRows([reviewItem()])

    expect(row).toMatchObject({
      id: "up-9",
      shipmentFee: 25,
      heavyShippingSurcharge: 75,
      skuCode: "SKU-REAL",
    })
  })

  it("carries the review status and nested product through", () => {
    const [row] = mapReviewItemsToRows([reviewItem()])

    expect(row?.reviewStatus?.approved).toBeNull()
    expect(row?.product?.name).toBe("Heavy Product")
  })
})

describe("patchProductRow", () => {
  const data = {
    rows: [
      { id: "up-1", productName: "First", price: 10 },
      { id: "up-2", productName: "Second", price: 20 },
    ],
    totalPages: 1,
    totalElements: 2,
  } as unknown as { rows: ProductWithDetails[]; totalPages: number; totalElements: number }

  it("replaces only the matching row's patched fields", () => {
    const patched = patchProductRow(data, "up-1", { price: 99 })

    expect(patched.rows[0]).toMatchObject({ id: "up-1", productName: "First", price: 99 })
    expect(patched.rows[1]).toEqual(data.rows[1])
  })

  it("leaves pagination metadata untouched", () => {
    const patched = patchProductRow(data, "up-1", { price: 99 })
    expect(patched.totalPages).toBe(1)
    expect(patched.totalElements).toBe(2)
  })

  it("is a no-op when the id is not in the list", () => {
    const patched = patchProductRow(data, "missing", { price: 99 })
    expect(patched.rows).toEqual(data.rows)
  })
})
