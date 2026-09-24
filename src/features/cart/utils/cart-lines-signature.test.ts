import { describe, expect, it } from "vitest"
import { makeCartItem, makeCartUserProduct } from "@/test/factories"
import { cartLinesSignature } from "./cart-lines-signature"

describe("cartLinesSignature", () => {
  it("returns an empty string for an empty cart", () => {
    expect(cartLinesSignature([])).toBe("")
  })

  it("joins userProductId:quantity pairs in item order", () => {
    const items = [
      makeCartItem({ userProduct: makeCartUserProduct({ userProductId: "up-1" }), quantity: 2 }),
      makeCartItem({ userProduct: makeCartUserProduct({ userProductId: "up-2" }), quantity: 5 }),
    ]

    expect(cartLinesSignature(items)).toBe("up-1:2,up-2:5")
  })

  it("changes when a quantity changes at an unchanged line count", () => {
    const before = [makeCartItem({ userProduct: makeCartUserProduct({ userProductId: "up-1" }), quantity: 1 })]
    const after = [makeCartItem({ userProduct: makeCartUserProduct({ userProductId: "up-1" }), quantity: 2 })]

    expect(cartLinesSignature(before)).not.toBe(cartLinesSignature(after))
  })

  it("is sensitive to line order, matching the array identity the caller already keys effects on", () => {
    const a = makeCartItem({ userProduct: makeCartUserProduct({ userProductId: "up-1" }), quantity: 1 })
    const b = makeCartItem({ userProduct: makeCartUserProduct({ userProductId: "up-2" }), quantity: 1 })

    expect(cartLinesSignature([a, b])).not.toBe(cartLinesSignature([b, a]))
  })
})
