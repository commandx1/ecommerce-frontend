import { describe, expect, it } from "vitest"
import type { BuyerOrderItem } from "@/lib/api/buyer-orders"
import { hasOrderItemReturnFlowStarted } from "./return-flow"

describe("hasOrderItemReturnFlowStarted", () => {
  const base: BuyerOrderItem = {
    id: "item-return-flag",
    userProductId: "up-return-flag",
    productId: "product-return-flag",
    productName: "Dental Mirror",
    price: 12,
    quantity: 1,
    status: "DELIVERED",
    productCoverPhotoPath: null,
    sellerName: "Acme",
    sellerSurname: "Store",
    updatedDate: "2026-05-20T11:00:00Z",
  }

  it.each([
    { name: "no return fields at all", overrides: {}, expected: false },
    { name: "returnDate set", overrides: { returnDate: "2026-05-21T10:00:00Z" }, expected: true },
    { name: "returnDate is an empty string", overrides: { returnDate: "" }, expected: false },
    { name: "returnDate is whitespace only", overrides: { returnDate: "   " }, expected: false },
    { name: "returnRefundStatus set", overrides: { returnRefundStatus: "PENDING" }, expected: true },
    { name: "returnRefundStatus is an empty string", overrides: { returnRefundStatus: "" }, expected: false },
    { name: "legacy refundStatus set", overrides: { refundStatus: "APPROVED" }, expected: true },
    { name: "legacy refundStatus is whitespace only", overrides: { refundStatus: "  " }, expected: false },
  ])("$name -> $expected", ({ overrides, expected }) => {
    expect(hasOrderItemReturnFlowStarted({ ...base, ...overrides })).toBe(expected)
  })
})
