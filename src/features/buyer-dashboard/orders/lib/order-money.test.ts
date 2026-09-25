import { describe, expect, it } from "vitest"
import type { BuyerOrderItem } from "@/lib/api/buyer-orders"
import {
  getOrderItemHeavyShipmentFee,
  getOrderItemShipmentFee,
  getOrderItemTaxPrice,
  resolveOrderMoneyBreakdown,
} from "./order-money"

// ---------------------------------------------------------------------------
// `shipmentPrice` / `takedHeavyShipmentFee` / `taxPrice` are LINE TOTALS from the backend
// (BuyerOrderItemResponse), not per-unit values - they must never be multiplied by quantity
// again on the frontend. `heavyShippingSurcharge` is a separate, CURRENT per-unit product
// value and must NOT be used for money display.
// ---------------------------------------------------------------------------
describe("getOrderItemShipmentFee / getOrderItemHeavyShipmentFee / getOrderItemTaxPrice", () => {
  const baseItem: BuyerOrderItem = {
    id: "item-money",
    userProductId: "up-money",
    productId: "product-money",
    productName: "Dental Kit",
    price: 55.3,
    quantity: 2,
    status: "WAITING_FOR_SHIPMENT",
    productCoverPhotoPath: null,
    sellerName: "Acme",
    sellerSurname: "Store",
    updatedDate: "2026-05-20T11:00:00Z",
  }

  it("does not multiply shipmentPrice by quantity - it is already the line total", () => {
    const item: BuyerOrderItem = { ...baseItem, shipmentPrice: 12.99, quantity: 2 }
    expect(getOrderItemShipmentFee(item)).toBe(12.99)
  })

  it("shows the charged shipment amount even when shipmentFreeBySeller is true (Uber orders can have both)", () => {
    const item: BuyerOrderItem = { ...baseItem, shipmentPrice: 12.99, shipmentFreeBySeller: true }
    expect(getOrderItemShipmentFee(item)).toBe(12.99)
  })

  it("treats shipmentPrice 0 or null as free shipping (0)", () => {
    expect(getOrderItemShipmentFee({ ...baseItem, shipmentPrice: 0 })).toBe(0)
    expect(getOrderItemShipmentFee({ ...baseItem, shipmentPrice: null })).toBe(0)
    expect(getOrderItemShipmentFee({ ...baseItem })).toBe(0)
  })

  it("getOrderItemHeavyShipmentFee reads takedHeavyShipmentFee (the charged total), defaulting to 0", () => {
    expect(getOrderItemHeavyShipmentFee({ ...baseItem, takedHeavyShipmentFee: 50 })).toBe(50)
    expect(getOrderItemHeavyShipmentFee({ ...baseItem, takedHeavyShipmentFee: 0 })).toBe(0)
    expect(getOrderItemHeavyShipmentFee({ ...baseItem, takedHeavyShipmentFee: null })).toBe(0)
    expect(getOrderItemHeavyShipmentFee({ ...baseItem })).toBe(0)
  })

  it("getOrderItemTaxPrice reads taxPrice, defaulting to 0", () => {
    expect(getOrderItemTaxPrice({ ...baseItem, taxPrice: 3.5 })).toBe(3.5)
    expect(getOrderItemTaxPrice({ ...baseItem, taxPrice: null })).toBe(0)
    expect(getOrderItemTaxPrice({ ...baseItem })).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Priority 1: money. Backend `OrderMapper` computes `totalPrice` independently
// of item price + shipment fee sums (tax, promos, rounding). `resolveOrderMoneyBreakdown`
// reconciles the two: it trusts the backend total when present, and derives an implied
// "tax" only when the backend total is strictly HIGHER than item+shipping. If it's wrong,
// the buyer sees an incorrect charge on their own order.
// ---------------------------------------------------------------------------
describe("resolveOrderMoneyBreakdown", () => {
  it.each([
    {
      name: "no explicit backend total -> falls back to item+shipping, no tax",
      itemTotal: 100,
      shippingTotal: 10,
      explicitTotal: undefined,
      expected: { tax: 0, netTotal: 110 },
    },
    {
      name: "explicit total exactly equals item+shipping -> no tax (boundary: not > or <)",
      itemTotal: 100,
      shippingTotal: 10,
      explicitTotal: 110,
      expected: { tax: 0, netTotal: 110 },
    },
    {
      name: "explicit total is HIGHER than item+shipping -> the difference is tax",
      itemTotal: 100,
      shippingTotal: 10,
      explicitTotal: 120,
      expected: { tax: 10, netTotal: 120 },
    },
    {
      name: "explicit total is LOWER than item+shipping -> trust backend total, tax is 0 (not negative)",
      itemTotal: 100,
      shippingTotal: 10,
      explicitTotal: 90,
      expected: { tax: 0, netTotal: 90 },
    },
    {
      name: "explicit total is NaN -> not finite, falls back to item+shipping",
      itemTotal: 50,
      shippingTotal: 5,
      explicitTotal: Number.NaN,
      expected: { tax: 0, netTotal: 55 },
    },
    {
      name: "explicit total is Infinity -> not finite, falls back to item+shipping",
      itemTotal: 50,
      shippingTotal: 5,
      explicitTotal: Number.POSITIVE_INFINITY,
      expected: { tax: 0, netTotal: 55 },
    },
    {
      name: "explicit total is 0 (a real, valid backend total, not 'missing') -> trusted as-is",
      itemTotal: 20,
      shippingTotal: 0,
      explicitTotal: 0,
      expected: { tax: 0, netTotal: 0 },
    },
    {
      name: "zero item and shipping totals with a positive explicit total -> entire total is tax",
      itemTotal: 0,
      shippingTotal: 0,
      explicitTotal: 7.5,
      expected: { tax: 7.5, netTotal: 7.5 },
    },
    {
      name: "fractional cents -> difference computed without rounding surprises",
      itemTotal: 19.99,
      shippingTotal: 4.99,
      explicitTotal: 26.58,
      expected: { tax: 1.6, netTotal: 26.58 },
    },
  ])("$name", ({ itemTotal, shippingTotal, explicitTotal, expected }) => {
    const result = resolveOrderMoneyBreakdown(itemTotal, shippingTotal, explicitTotal)
    expect(result.netTotal).toBe(expected.netTotal)
    expect(result.tax).toBeCloseTo(expected.tax, 10)
  })
})
