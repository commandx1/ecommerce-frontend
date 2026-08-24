import { describe, expect, it } from "vitest"
import { makeCartItem } from "@/test/factories"
import { getBlockingCartItems, getCartItemAlerts, hasBlockingCartAlert, normalizeCartAlert } from "./cart-alerts"

describe("normalizeCartAlert", () => {
  it("returns null for null", () => {
    expect(normalizeCartAlert(null)).toBeNull()
  })

  it("returns null for undefined", () => {
    expect(normalizeCartAlert(undefined)).toBeNull()
  })

  it("returns null for an empty string", () => {
    expect(normalizeCartAlert("")).toBeNull()
  })

  it("returns null for a whitespace-only string", () => {
    expect(normalizeCartAlert("   ")).toBeNull()
  })

  it("trims surrounding whitespace from a real alert", () => {
    expect(normalizeCartAlert("  uyarı  ")).toBe("uyarı")
  })
})

describe("getCartItemAlerts", () => {
  it("normalizes product.productAlert, userProduct.stockAlert, and userProduct.userProductAlert", () => {
    const item = makeCartItem({
      product: {
        id: "p-1",
        name: "Item",
        coverPhotoPath: "/x.png",
        productAlert: "  low stock  ",
        dentalLicenseRequired: null,
      },
      userProduct: {
        userProductId: "up-1",
        oldPrice: 10,
        price: 10,
        discount: 0,
        shipmentFee: 0,
        heavyShippingSurcharge: 0,
        stock: 5,
        stockAlert: "",
        userProductAlert: "  ",
        sellerId: "seller-1",
        sellerName: "Acme",
      },
    })

    expect(getCartItemAlerts(item)).toEqual({
      productAlert: "low stock",
      stockAlert: null,
      userProductAlert: null,
    })
  })

  it("returns all-null alerts when none are set", () => {
    const item = makeCartItem()
    expect(getCartItemAlerts(item)).toEqual({
      productAlert: null,
      stockAlert: null,
      userProductAlert: null,
    })
  })
})

describe("hasBlockingCartAlert", () => {
  it("blocks when product.productAlert alone is set", () => {
    const item = makeCartItem({
      product: {
        id: "p-1",
        name: "Item",
        coverPhotoPath: "/x.png",
        productAlert: "discontinued",
        dentalLicenseRequired: null,
      },
    })
    expect(hasBlockingCartAlert(item)).toBe(true)
  })

  it("blocks when userProduct.stockAlert alone is set", () => {
    const item = makeCartItem({
      userProduct: {
        userProductId: "up-1",
        oldPrice: 10,
        price: 10,
        discount: 0,
        shipmentFee: 0,
        heavyShippingSurcharge: 0,
        stock: 5,
        stockAlert: "low stock",
        userProductAlert: null,
        sellerId: "seller-1",
        sellerName: "Acme",
      },
    })
    expect(hasBlockingCartAlert(item)).toBe(true)
  })

  it("blocks when userProduct.userProductAlert alone is set", () => {
    const item = makeCartItem({
      userProduct: {
        userProductId: "up-1",
        oldPrice: 10,
        price: 10,
        discount: 0,
        shipmentFee: 0,
        heavyShippingSurcharge: 0,
        stock: 5,
        stockAlert: null,
        userProductAlert: "seller flagged this listing",
        sellerId: "seller-1",
        sellerName: "Acme",
      },
    })
    expect(hasBlockingCartAlert(item)).toBe(true)
  })

  it("does not block when all three alert fields are whitespace-only", () => {
    const item = makeCartItem({
      product: { id: "p-1", name: "Item", coverPhotoPath: "/x.png", productAlert: "   ", dentalLicenseRequired: null },
      userProduct: {
        userProductId: "up-1",
        oldPrice: 10,
        price: 10,
        discount: 0,
        shipmentFee: 0,
        heavyShippingSurcharge: 0,
        stock: 5,
        stockAlert: "  ",
        userProductAlert: " ",
        sellerId: "seller-1",
        sellerName: "Acme",
      },
    })
    expect(hasBlockingCartAlert(item)).toBe(false)
  })

  it("does not block when all three alert fields are null", () => {
    const item = makeCartItem()
    expect(hasBlockingCartAlert(item)).toBe(false)
  })
})

describe("getBlockingCartItems", () => {
  it("returns an empty array for an empty input", () => {
    expect(getBlockingCartItems([])).toEqual([])
  })

  it("returns an empty array when none of the items are blocking", () => {
    const items = [makeCartItem({ id: "ci-1" }), makeCartItem({ id: "ci-2" })]
    expect(getBlockingCartItems(items)).toEqual([])
  })

  it("filters to only the blocking items while preserving order", () => {
    const blockingA = makeCartItem({
      id: "ci-1",
      product: {
        id: "p-1",
        name: "A",
        coverPhotoPath: "/a.png",
        productAlert: "recalled",
        dentalLicenseRequired: null,
      },
    })
    const clean = makeCartItem({ id: "ci-2" })
    const blockingB = makeCartItem({
      id: "ci-3",
      userProduct: {
        userProductId: "up-3",
        oldPrice: 10,
        price: 10,
        discount: 0,
        shipmentFee: 0,
        heavyShippingSurcharge: 0,
        stock: 0,
        stockAlert: "out of stock",
        userProductAlert: null,
        sellerId: "seller-3",
        sellerName: "Acme",
      },
    })

    expect(getBlockingCartItems([blockingA, clean, blockingB])).toEqual([blockingA, blockingB])
  })
})
